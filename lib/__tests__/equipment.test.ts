import { describe, expect, it } from "vitest";

import {
  ALL_EQUIPMENT,
  EQUIPMENT,
  getEquipment,
  defaultEquipmentForCategory,
} from "@/lib/equipment";

describe("EQUIPMENT-Katalog", () => {
  it("hält Schlüssel und id-Feld jedes Eintrags konsistent", () => {
    for (const [key, def] of Object.entries(EQUIPMENT)) {
      expect(def.id).toBe(key);
    }
  });

  it("spiegelt den Katalog vollständig in ALL_EQUIPMENT", () => {
    expect(ALL_EQUIPMENT).toHaveLength(Object.keys(EQUIPMENT).length);
    expect(ALL_EQUIPMENT).toContain(EQUIPMENT.bodyweight);
  });
});

describe("getEquipment", () => {
  it("liefert exakt das Katalog-Objekt zurück", () => {
    expect(getEquipment("heavy-bag")).toBe(EQUIPMENT["heavy-bag"]);
    expect(getEquipment("heavy-bag").label).toBe("Boxsack");
  });
});

describe("defaultEquipmentForCategory", () => {
  it("wählt für BJJ genau die passenden Geräte (in Katalog-Reihenfolge)", () => {
    expect(defaultEquipmentForCategory("bjj")).toEqual([
      "bodyweight",
      "mat",
      "resistance-band",
      "dummy",
    ]);
  });

  it("enthält für Boxing typische Schlag-Geräte, aber keine Matte/Dummy", () => {
    const boxing = defaultEquipmentForCategory("boxing");
    expect(boxing).toContain("heavy-bag");
    expect(boxing).toContain("pads");
    expect(boxing).not.toContain("mat");
    expect(boxing).not.toContain("dummy");
  });

  it("liefert nur Geräte, deren defaultFor die Kategorie führt", () => {
    for (const cat of ["boxing", "wrestling", "bjj", "muay-thai"] as const) {
      for (const id of defaultEquipmentForCategory(cat)) {
        expect(EQUIPMENT[id].defaultFor).toContain(cat);
      }
    }
  });
});
