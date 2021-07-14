import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { map, catchError } from "rxjs/operators";
import { HttpErrorResponse } from "@angular/common/http";
import { EMPTY, Observable } from "rxjs";

@Injectable({
	providedIn: "root"
})
export class DataProxyService {
	private readonly httpOptions: any = {
		headers: {
			Accept: "application/json, text/plain, */*",
			"Content-Type": "application/json"
		}
	};

	constructor(private httpClient: HttpClient) {}

	public executeService(path: string, input: any): Observable<any> {
		const baseUrl = "/dottweb/rest";

		if (path.endsWith("remove")) {
			return this.httpClient.delete(baseUrl + path + "/" + input, this.httpOptions).pipe(
				catchError((error: HttpErrorResponse) => {
					return this.handleTechnicalError(error);
				})
			);
		}

		if (
			path.endsWith("getDetails") ||
			path.endsWith("getById") ||
			path.endsWith("getDetails")
		) {
			return this.httpClient.get(baseUrl + path + "/" + input, this.httpOptions).pipe(
				map(response => {
					if (response["messageType"]) {
						return this.handleFunctionalError(response);
					}

					return response;
				}),
				catchError((error: HttpErrorResponse) => {
					return this.handleTechnicalError(error);
				})
			);
		}

		if (path.endsWith("update")) {
			return this.httpClient.put(baseUrl + path, input, this.httpOptions).pipe(
				map(response => {
					if (response["messageType"] === "Error") {
						return this.handleFunctionalError(response);
					} else if (response["messageType"].toLowerCase() === "success") {
						return response;
					}

					return response;
				}),
				catchError((error: HttpErrorResponse) => {
					return this.handleTechnicalError(error);
				})
			);
		}

		return this.httpClient.post(baseUrl + path, input, this.httpOptions).pipe(
			map(response => {
				if (response["messageType"] === "Error") {
					return this.handleFunctionalError(response);
				} else if (response["messageType"].toLowerCase() === "success") {
					return response;
				}

				return response;
			}),
			catchError((error: HttpErrorResponse) => {
				return this.handleTechnicalError(error);
			})
		);
	}

	public getData(query: string, offset?: number, limit?: number) {
		return this.httpClient
			.post(
				"/dottweb/rest/Common/genericQueryUI?simpleFormat=true" +
					"&offset=" +
					(offset ? offset : 0) +
					"&limit=" +
					(limit ? limit : 0),
				query,
				this.httpOptions
			)
			.pipe(
				map(response => {
					if (response["messageType"]) {
						return this.handleFunctionalError(response);
					}
					return response["queryResults"];
				}),
				catchError((error: HttpErrorResponse) => {
					return this.handleTechnicalError(error);
				})
			);
	}

	public getVeri95Data(query: string, offset?: number, limit?: number) {
		return this.httpClient
			.post(
				"/veri95web/rest/Common/genericQueryUI?simpleFormat=true" +
					"&offset=" +
					(offset ? offset : 0) +
					"&limit=" +
					(limit ? limit : 0),
				query,
				this.httpOptions
			)
			.pipe(
				map(response => {
					if (response["messageType"]) {
						return this.handleFunctionalError(response);
					}
					return response["queryResults"];
				}),
				catchError((error: HttpErrorResponse) => {
					return this.handleTechnicalError(error);
				})
			);
	}

	handleTechnicalError<HttpResponse>(error: HttpErrorResponse) {
		if (error.error instanceof Error) {
			// A client-side or network error occurred. Handle it accordingly.
			console.error("An error occurred:", error.error.message);
		} else {
			// The backend returned an unsuccessful response code.
			// The response body may contain clues as to what went wrong,
			console.error(
				`Backend returned code ${error.status}, body was: ${error.error.messageContent}`
			);
		}

		// If you want to return a new response:
		// return of(new HttpResponse({body: [{name: "Default value..."}]}));

		// If you want to return the error on the upper level:
		// return throwError(error);
		// or just return nothing:
		return EMPTY;
	}

	handleFunctionalError<HttpResponse>(message: {}) {
		if (message["messageType"] === "Error") {
			// A client-side or network error occurred. Handle it accordingly.
			console.error("An error occurred:", message["messageContent"]);
		}

		if (message["messageType"] === "Information") {
			console.warn("Information:", message["messageContent"]);
		}
		if (message["messageType"] === "Success") {
			console.log("Success:", message["messageContent"]);
		}
		return [];
	}
}
