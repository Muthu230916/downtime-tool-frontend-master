import { LanguageCodes } from "../enums/language-codes.enum";
import { Base } from "../models/queries/base.model";

export class Localization extends Base {
	languageId: LanguageCodes;
	name?: string;
	description?: string;
}
