import { DOCUMENT } from "@angular/common";
import { APP_INITIALIZER } from "@angular/core";
import { darkmodeFactory } from "../factories/darkmode.factory";

export const INITIALIZER_PROVIDER = [
  {
    provide: APP_INITIALIZER,
    useFactory: (d: Document) => () => darkmodeFactory(d),
    deps: [DOCUMENT],
    multi: true,
  },
]