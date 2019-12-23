type ActivityDomain = 'Work' | 'Personal' | 'Unrestricted' | 'Unknown'; //The nature of an activity.
type AttendeeType = "required" | "optional";
type AutomaticRepliesStatus = 'AlwaysEnabled' | 'Disabled' | 'Scheduled'; //The configuration status for automatically sending a reply when the user's mailbox receives a message.
type ExternalAudienceScope = 'All' | 'ContactsOnly' | 'None'; //The set of external audience to send the ExternalReplyMessage to.
type FreeBusyStatus = 'Busy' | 'Free' | 'Oof' | 'Tentative' | 'Unknown' | 'WorkingElsewhere'; //Specifies the availability status of an attendee for a meeting.
type Importance = 'Low' | 'Medium' | 'High';
type InferenceClassificationType = 'Focused' | 'Other';  //Represents the inferred relevance of a message for a user to focus on.
type ReferenceAttachmentPermissions = 'Other' | 'View' | 'Edit' | 'AnonymousView' | 'AnonymousEdit' | 'OrganizationView' | 'OrganizationEdit'; //Access permissions for the file or folder of the reference attachment.
type ReferenceAttachmentProviders = 'Dropbox' | 'OneDriveBusiness' | 'OneDriveConsumer' | 'Other'; //Possible file storage providers for reference attachments.
type ResponseType = 'tResponded';
type Sensitivity = 'Normal' | 'Personal' | 'Private' | 'Confidential'; //Indicates the level of privacy.
type TaskStatus = 'Completed' | 'Deferred' | 'InProgress' | 'NotStarted' | 'WaitingOnOthers'; //Specifies the state or progress of a task.

export class Attendee {
  emailAddress: EmailAddressDetail;
  type: AttendeeType;
  constructor() { }
}
export class EmailAddressDetail {
  address: string;
  name: string;
  constructor() { }
}


export class CalendarColor {
  Name: string
  Value: number // LightBlue=0, LightGreen=1, LightOrange=2, LightGray=3, LightYellow=4, LightTeal=5, LightPink=6, LightBrown=7, LightRed=8, MaxColor=9, Auto=-1
  constructor() { }
}

export class EmailAddress {
  Name: string //The display name of the person or entity.
  Address: string	 //The email address of the person or entity.
  constructor() { }
}

export class ItemBody {
  ContentType: number //The content type: Text = 0, HTML = 1.
  Content: string //The text or HTML content
  constructor() { }
}

export class GeoCoordinates {
  Altitude: number	//The altitude of the location.
  Latitude: number	//The latitude of the location.
  Longitude: number	//The longitude of the location.
  Accuracy: number	//The accuracy of the sensor providing the latitude and longitude.
  AltitudeAccuracy: number	//The accuracy of the sensor providing the altitude.
  constructor() { }
}

export class PhysicalAddress {
  Street: string	//The street.
  City: string	//The city.
  State: string	//The state.
  CountryOrRegion: string	//The country or region. It's a free-format string value, for example, "United States".
  PostalCode: string	//The postal code.
  constructor() { }
}

export class Location {
  DisplayName: string	//The name associated with the location.
  Address: PhysicalAddress	//The physical address of the location.
  Coordinate: GeoCoordinates	//The geographic coordinates and elevation of the location.
  LocationEmailAddress: string	//Optional email address of the location.
  constructor() { }
}

export class Recipient {
  EmailAddress: EmailAddress
  constructor() { }
}

export class Folder {
  ChildFolderCount: number //The number of folders in the folder.	No
  ChildFolders: Folder[]	//The collection of child folders in the folder. Navigation property.
  DisplayName: string	//The folder's display name.
  Id: string	//The folder's unique identifier. You can use the following well-known names to access the corresponding folder: Inbox, Drafts, SentItems, DeletedItems.
  Messages: any[]	//The collection of messages in the folder. Navigation property.
  ParentFolderId: string	//The unique identifier for the folder's parent folder.
  TotalItemCount: number	//The number of items in the folder.	No
  UnreadItemCount: number	//The number of items in the folder marked as unread.	No
  MultiValueExtendedProperties: any[]	//A collection of multi-value extended properties of type MultiValueLegacyExtendedProperty. This is a navigation property. Find more information about extended properties.
  SingleValueExtendedProperties: any[]	//A collection of single-value extended properties of type SingleValueLegacyExtendedProperty. This is a navigation property. Find more information about extended properties.
  constructor() { }
}

export class User {
  Alias: string	//The user's alias. Typically the SMTP address of the user.
  Calendar: Calendar	//The user's primary calendar. Navigation property.
  CalendarGroups: any[]	//The user's calendar groups. Navigation property.
  Calendars: Calendar[]	//The user's calendars. Navigation property.
  CalendarView: Event[]	//The calendar view for the calendar. Navigation property.
  ContactFolders: any[]	//The user's contacts folders. Navigation property.
  Contacts: any[]	//The user's contacts. Navigation property.
  DisplayName: string	//The user's display name.
  Events: Event[]	//The user's events. Default is to show Events under the Default Calendar. Navigation property.
  Id: string	//The unique identifier for the user.
  InferenceClassification: any	//Relevance classification of the user's messages based on explicit designations which override inferred relevance or importance. Navigation property.
  MailboxGuid: string	//The GUID assigned to the user's mailbox.	No
  MailboxSettings: any	//Settings for the primary mailbox of the signed-in user.		No
  MailFolders: Folder[]	//The folders in a mailbox. Navigation property.
  Messages: any[]	//The messages in a mailbox or folder. Navigation property.
  RootFolder: Folder	//The root folder of the user's mailbox. Navigation property.
  constructor() { }
}

export class RecurrencePattern {
  Type: number //	The recurrence pattern type: Daily = 0, Weekly = 1, AbsoluteMonthly = 2, RelativeMonthly = 3, AbsoluteYearly = 4, RelativeYearly = 5.
  Interval: number            //	The number of units of a given recurrence type between occurrences.
  DayOfMonth: number          //The day of month that the item occurs on.
  Month: number          //The month that the item occurs on. This is a number from 1 to 12.
  DaysOfWeek: number[]	    //A collection of days of the week: Sunday = 0, Monday = 1, Tuesday = 2, Wednesday = 3, Thursday = 4, Friday = 5, Saturday = 6.
  FirstDayOfWeek: number 	//The day of the week: Sunday = 0, Monday = 1, Tuesday = 2, Wednesday = 3, Thursday = 4, Friday = 5, Saturday = 6.
  Index: number	           //The week index: First = 0, Second = 1, Third = 2, Fourth = 3, Last = 4.
  constructor() { }
}

export class RecurrenceRange {
  Type: number	 //The recurrence range: EndDate = 0, NoEnd = 1, Numbered = 2.
  StartDate: Date	//The start date of the series.
  EndDate: Date	//The end date of the series.
  NumberOfOccurrences: number	//How many times to repeat the event.
  constructor() { }
}

export class PatternedRecurrence {
  Pattern: RecurrencePattern
  Range: RecurrenceRange
  constructor() { }
}

export class ResponseStatus {
  Response: ResponseType
  Time: Date    //The date and time that the response was returned.
  constructor() { }
}

export class Timeslot {
  Start: Date
  End: Date
  constructor() { }
  /*constructor(start: Date, end: Date){
    this.Start = new Date(start.getDate());
    this.End = new Date(end.getDate());
  }*/
}

export class TimeConstraint {
  ActivityDomain: ActivityDomain
  Timeslots: Timeslot[]
  constructor() { }
}

export class Event {
  Attachments: any[]
  Attendees: Attendee[]
  Body: ItemBody
  BodyPreview: string
  Calendar: Calendar
  Categories: string[]
  ChangeKey: string
  CreatedDateTime: Date
  LastModifiedDateTime: Date
  end: Date
  Extensions: any[]
  HasAttachments: boolean
  Id: string
  Importance: Importance
  Instances: Event[]
  iCalUID: string
  IsAllDay: boolean
  IsCancelled: boolean
  IsOrganizer: boolean
  IsReminderOn: Boolean
  Location: Location
  OnlineMeetingUrl: string
  Organizer: Recipient
  OriginalEndTimeZone: string
  OriginalStartTimeZone: string
  Recurrence: PatternedRecurrence
  ReminderMinutesBeforeStart: number
  ResponseRequested: boolean
  ResponseStatus: ResponseStatus
  Sensitivity: Sensitivity
  SeriesMasterId: string
  ShowAs: FreeBusyStatus
  start: Date
  Style: any
  subject: string
  Type: number //The event type: SingleInstance = 0, Occurrence = 1, Exception = 2, SeriesMaster = 3.
  WebLink: string
  constructor() {

  }
}

export class Calendar {
  CanEdit: boolean
  CanShare: boolean
  CanViewPrivateItems: boolean
  ChangeKey: string
  Color: CalendarColor
  Id: string
  Name: string
  Owner: EmailAddress
  CalendarView: Event[]
  Events: Event[]
  MultiValueExtendedProperties: any[]
  SingleValueExtendedProperties: any[]
  constructor() { }
}
