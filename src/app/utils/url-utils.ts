import { HttpHeaders } from "@angular/common/http";
import { Param } from "../models/Params";

export class UrlUtils {
  static toQueryParams(params: any): string {
    if (params.length == 1) return `?${params[0].key}=${params[0].value}`;
    return params.reduce(
      (accumulator: Param, currentValue: Param) =>
        `${accumulator.value
          ? `?${accumulator.key}=${accumulator.value}`
          : accumulator
        }&${currentValue.key}=${currentValue.value}`
    );
  }

  static toHeaders(params?: Param[]): HttpHeaders {
    var headers = new HttpHeaders();
    params?.forEach((param) => {
      headers = headers.append(param.key, param.value);
    });
    return headers;
  }
}
