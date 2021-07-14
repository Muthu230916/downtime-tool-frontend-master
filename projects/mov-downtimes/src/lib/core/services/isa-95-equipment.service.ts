import { DataProxyService } from "./data-proxy.service";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { EquipmentClass } from "../models/queries/equipment-class.model";
import { Equipment } from "../models/queries/equipment.model";

@Injectable({
	providedIn: "root",
})
export class Isa95EquipmentService {
	equipmentIds: String[] = [];

	constructor(private dataProxyService: DataProxyService) {}

	public getAllIsa95EquipmentClasses(): Observable<EquipmentClass[]> {
		return this.dataProxyService.getVeri95Data(
			`SELECT ec.id, CASE WHEN count(ec.id) > 0 THEN true ELSE false END @hasEquipment@,
			des.languageID,
			des.description
			FROM EquipmentClass ec
			LEFT JOIN ec.equipmentClassDescriptions des
            GROUP BY ec.id, des.languageID,	des.description`
		);
	}

	public getAllIsa95Equipments(): Observable<Equipment[]> {
		return this.dataProxyService.getVeri95Data(
			`SELECT e.id, CASE WHEN count(e.id) > 0 THEN true ELSE false END @hasEquipment@,
			des.languageID,
			des.description
			FROM Equipment e
			LEFT JOIN e.equipmentDescriptions des
            GROUP BY e.id, des.languageID,	des.description`
		);
	}

	public getAllIsa95ClassesForEquipments(equipmentIds: string): Observable<EquipmentClass[]> {
		return this.dataProxyService.getVeri95Data(
			`SELECT ec.id, e.id @equipmentId@
            FROM EquipmentClass ec
            JOIN ec.equipments eclink
			JOIN eclink.equipment e
            WHERE e.id IN (${equipmentIds})
            GROUP BY ec.id, e.id`
		);
	}

	public getIsa95EquipmentsWithoutClass(linesQ: string): Observable<Equipment[]> {
		return this.dataProxyService.getVeri95Data(
			`SELECT e.id, CASE WHEN count(e.id) > 0 THEN true ELSE false END @hasEquipment@,
			des.languageID,
			des.description
		FROM Equipment e
		LEFT JOIN e.equipmentDescriptions des
		WHERE NOT EXISTS (
			SELECT eclink.uiid
			FROM e.equipmentClasses eclink
            ) AND e.id IN (${linesQ})
            GROUP BY e.id, des.languageID,	des.description`
		);
	}

	public getIsa95EquipmentsForClassId(classId: string): Observable<Equipment[]> {
		return this.dataProxyService.getVeri95Data(
			`SELECT e.id, CASE WHEN count(e.id) > 0 THEN true ELSE false END @hasEquipment@,
			des.languageID,
			des.description
			FROM Equipment e
			JOIN e.equipmentClasses eclink
			JOIN eclink.equipmentClass ec ON ec.id = '${classId}'
			LEFT JOIN e.equipmentDescriptions des
            GROUP BY e.id, des.languageID,	des.description`
		);
	}
}
