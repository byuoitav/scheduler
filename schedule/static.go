package schedule

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"

	"github.com/byuoitav/scheduler/log"
	"go.uber.org/zap"
)

type staticDoc struct {
	ID  string `json:"_id"`
	Rev string `json:"_rev"`

	Attachments map[string]fileAttachment `json:"_attachments"`
}

type fileAttachment struct {
	ContentType string `json:"content_type"`
	RevPos      int    `json:"revpos"`
	Digest      string `json:"digest"`
	Length      int    `json:"length"`
	Stub        bool   `json:"stub"`
}

func GetStatic(ctx context.Context, docName string) (io.ReadCloser, string, error) {
	log.P.Info("Getting static document", zap.String("docName", docName))

	//get 'static' document
	var static staticDoc
	url := fmt.Sprintf("%s/%s/%s", os.Getenv("DB_ADDRESS"), "schedulers", "static")

	body, err := makeRequest(ctx, "GET", url, "", nil)
	if err != nil {
		return nil, "", err
	}
	defer body.Close()

	b, err := ioutil.ReadAll(body)
	if err != nil {
		log.P.Error("failed to read http response body", zap.Error(err))
		return nil, "", err
	}

	err = json.Unmarshal(b, &static)
	if err != nil {
		log.P.Error("failure to unmarshal resp body", zap.String("body", string(b)), zap.Error(err))
		return nil, "", err
	}

	//get file type
	fileType := static.Attachments[docName].ContentType
	if fileType == "" {
		return nil, "", fmt.Errorf("document (%s) does not exist", docName)
	}

	//get actual file
	url = fmt.Sprintf("%s/%s/%s/%s", os.Getenv("DB_ADDRESS"), "schedulers", "static", docName)
	file, err := makeRequest(ctx, "GET", url, "", nil)

	//return stream
	return file, fileType, nil
}

func makeRequest(ctx context.Context, method, url, contentType string, body []byte) (io.ReadCloser, error) {
	log.P.Info("making http request", zap.String("dest-url", url))
	req, err := http.NewRequestWithContext(ctx, method, url, bytes.NewReader(body))
	if err != nil {
		log.P.Error("failed to create new http request", zap.String("url", url), zap.Error(err))
		return nil, err
	}

	req.SetBasicAuth(os.Getenv("DB_USERNAME"), os.Getenv("DB_PASSWORD"))
	if len(contentType) > 0 {
		req.Header.Add("Content-Type", contentType)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.P.Error("failed to make http request", zap.String("url", url), zap.Error(err))
		return nil, err
	}

	if resp.StatusCode/100 != 2 {
		log.P.Error("bad response code", zap.Int("resp code", resp.StatusCode))
		return nil, fmt.Errorf("bad response code - %v", resp.StatusCode)
	}

	return resp.Body, nil
}
