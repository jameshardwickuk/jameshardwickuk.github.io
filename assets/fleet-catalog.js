/* Paper diesel sheet fleet — updated 27.03.26 */
const PAPER_WAGONS = [
  "MV73 YPJ", "MV73 YPK", "MV73 YPL", "MV73 YPM",
  "MC24 OSG", "MC24 OSJ", "MC24 OSK",
  "MV25 GTU", "MV25 GTY", "MV25 GTZ",
  "MV75 EHR", "MV75 EHS",
  "MV26 DXL", "MV26 DXM", "MV26 DXO"
];

const PAPER_OTHER = [
  { reg: "FD73 WVY", type: "bowser", category: "ADR tanker bowser", meter: "miles" },
  { reg: "DG75 ULV", type: "tipper", category: "Wagon / tanker", meter: "miles" },
  { reg: "YG21 EBA", type: "tipper", category: "Support wagon", meter: "miles" },
  { reg: "WU20 FBL", type: "tipper", category: "Support wagon", meter: "miles" }
];

function paperAssets() {
  const wagons = PAPER_WAGONS.map((reg) => ({
    id: "w-" + reg.replace(/\s+/g, ""),
    fleetNo: reg,
    reg,
    type: "tipper",
    category: "Tipper wagon",
    make: "",
    model: "",
    tank: 400,
    meter: "miles",
    expected: 5.5,
    unitExpect: "mpg",
    onSheet: "wagon"
  }));
  const other = PAPER_OTHER.map((o) => ({
    id: "w-" + o.reg.replace(/\s+/g, ""),
    fleetNo: o.reg,
    reg: o.reg,
    type: o.type,
    category: o.category,
    make: "",
    model: "",
    tank: o.type === "bowser" ? 14153 : 400,
    meter: o.meter,
    expected: 5.5,
    unitExpect: "mpg",
    onSheet: o.reg === "FD73 WVY" ? "bowser" : "other"
  }));
  return [...wagons, ...other];
}
