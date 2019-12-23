import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainPageComponent } from './components/main-page/main-page.component';
import { BookPageComponent } from './components/book-page/book-page.component';
import { SchedulePageComponent } from './components/schedule-page/schedule-page.component';

const routes: Routes = [
  { path: '', component: MainPageComponent },
  { path: 'book', component: BookPageComponent },
  { path: 'schedule', component: SchedulePageComponent }
  // { path: 'web', redirectTo: '/', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
