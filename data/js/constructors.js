const loadUnitData = () => {
  const units = {};
  $.ajaxSetup({async: false}); // 同期通信(json取ってくるまで待つ)
  $.getJSON("../data/json/units.json", function (data) {
    $(data.units).each(function () {
      units[this.id] = {
        id: this.id,
        name: this.unit,
        short: this.short,
        color: this.color,
        sp_bg: this.sp_bg,
      };
    });
  });
  $.ajaxSetup({async: true}); // 非同期に戻す

  return units;
}
