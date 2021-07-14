import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { DowntimesRegistrationComponent, OverviewComponent, ReportsComponent } from "mov-downtimes";

const routes: Routes = [
	{ path: "masterdata", component: OverviewComponent },
	{ path: "downtimes", component: DowntimesRegistrationComponent },
	{ path: "reports", component: ReportsComponent },
	{ path: "", redirectTo: "masterdata", pathMatch: "full" }
];

@NgModule({
	imports: [RouterModule.forRoot(routes, { useHash: true })],
	exports: [RouterModule]
})
export class AppRoutingModule {}
