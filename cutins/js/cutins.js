const members = {};

$(function () {
  let hash = location.hash;
  if (hash === "#wdh") {
    $("#wandahoi").prop("checked", true);
  }

  loadMembers();
  showData();

  const fromSpace = $("div#from_list");
  const toSpace = $("div#to_list");
  for (let [key, value] of Object.entries(members)) {
    if (value.id.indexOf('miku') !== -1) {
      fromSpace.append("<br>");
      toSpace.append("<br>");
    }
    fromSpace.append("<div class=\"form-check form-check-inline\">"
      + "<label class=\"btn btn-sm\" for=\"from_" + value.id + "\" style=\"background-color: " + value.color + "\">"
      + "<input type=\"checkbox\" class=\"form-check-input from-members\" id=\"from_" + value.id + "\" value=\"" + value.id + "\" autocomplete=\"off\">"
      + value.name + "</label>"
      + "</div>");

    toSpace.append("<div class=\"form-check form-check-inline\">"
      + "<label class=\"btn btn-sm\" for=\"to_" + value.id + "\" style=\"background-color: " + value.color + "\">"
      + "<input type=\"checkbox\" class=\"form-check-input to-members\" id=\"to_" + value.id + "\" value=\"" + value.id + "\" autocomplete=\"off\">"
      + value.name + "</label>"
      + "</div>");
  }

  $("#search input").on("change", function () {
    showData();
  });

  $("div#play-modal").on('show.bs.modal', function (event) {
    eventPlayModal(event);
  });

  // ページのトップに移動
  $("#page-top").on("click", function () {
    $('html, body').animate({scrollTop: 0}, 500);
  });
  $("#page-bottom").on("click", function () {
    $('html, body').animate({scrollTop: $("body").get(0).scrollHeight}, 500);
  });
});

const loadMembers = () => {
  const units = loadUnitData();
  $.ajaxSetup({async: false}); // 同期通信(json取ってくるまで待つ)
  $.getJSON("../data/json/members.json", function (data) {
    $(data.members).each(function () {
      if (!this.is_active) {
        return true;
      }

      const regexp = /miku|rin|len|luka|meiko|kaito/;
      const isVirtualSinger = this.unit_id !== 1 && regexp.test(this.id);

      const unit = units[this.unit_id];
      members[this.id] = {
        id: this.id,
        name: (isVirtualSinger) ? this.short + "(" + unit.short + ")" : this.short,
        image: this.image,
        color: (isVirtualSinger) ? unit.color : this.color,
        unit: unit,
      };
    });
  });
  $.ajaxSetup({async: true}); // 非同期に戻す
}

const loadData = () => {
  // 表示対象セット
  const showFromMembers = getShowFrom();
  const showToMembers = getToFrom();
  const isFilterFrom = Object.keys(showFromMembers).filter((key) => !showFromMembers[key]).length !== 0;
  const isFilterTo = Object.keys(showToMembers).filter((key) => !showToMembers[key]).length !== 0;

  const showRetry = $("input[name=text]:checked").val();

  const result = [];
  const files = [
    "../data/json/cutins/cutins-default.json",
    "../data/json/cutins/cutins-vs.json",
    "../data/json/cutins/cutins-ln.json",
    "../data/json/cutins/cutins-mmj.json",
    "../data/json/cutins/cutins-vbs.json",
    "../data/json/cutins/cutins-ws.json",
    "../data/json/cutins/cutins-25.json",
    "../data/json/cutins/cutins-vs-ln.json",
    "../data/json/cutins/cutins-vs-mmj.json",
    "../data/json/cutins/cutins-vs-vbs.json",
    "../data/json/cutins/cutins-vs-ws.json",
    "../data/json/cutins/cutins-vs-25.json",
    "../data/json/cutins/cutins-ln-mmj.json",
    "../data/json/cutins/cutins-ln-vbs.json",
    "../data/json/cutins/cutins-ln-ws.json",
    "../data/json/cutins/cutins-ln-25.json",
    "../data/json/cutins/cutins-mmj-vbs.json",
    "../data/json/cutins/cutins-mmj-ws.json",
    "../data/json/cutins/cutins-mmj-25.json",
    "../data/json/cutins/cutins-vbs-ws.json",
    "../data/json/cutins/cutins-vbs-25.json",
    "../data/json/cutins/cutins-ws-25.json",
  ];

  $.ajaxSetup({async: false}); // 同期通信(json取ってくるまで待つ)
  for (let [key, value] of Object.entries(files)) {
    $.getJSON(value, function (data) {
      $(data.cutins).each(function () {

        const from = getMember(this.from);
        const to = getMember(this.to);

        if (isFilterFrom && isFilterTo) {
          if (!showFromMembers[from.id] || !showToMembers[to.id]) {
            return true;
          }
        } else {
          if (isFilterFrom && !showFromMembers[from.id]) {
            return true;
          }

          if (isFilterTo && !showToMembers[to.id]) {
            return true;
          }
        }

        if (showRetry === "wandahoi") {
          let regexp = /わんだほい|わんだほーい|だほい/;
          if (!regexp.test(from.interaction) && !regexp.test(to.interaction)) {
            return true;
          }
        }

        const cutin = {
          from: from,
          to: to,
          file: this.file,
          note: this.note,
        };
        result.push(cutin);
      });
    });
  }
  $.ajaxSetup({async: true}); // 非同期に戻す

  return result;
}

const getMember = (data) => {
  let icon = "<i class=\"bi bi-disc\" style=\"font-size: 3rem;\"></i>";
  let name = "-";
  let interaction = "-";
  let color = "#eee";

  if (data.member_id !== "") {
    const member = members[data.member_id];
    icon = "<img src=\"" + member.image + "\" alt=\"" + member.name + "\">";
    name = member.name;
    interaction = data.interaction;
    color = member.color;
  }

  return {
    id: data.member_id,
    icon: icon,
    name: name,
    interaction: interaction,
    color: color,
  }
}

const showData = () => {
  $("#loading").removeClass("d-none");
  $("#cutin").addClass("d-none");

  const data = loadData();
  $("#cutin table tbody").html("");

  for (let [key, value] of Object.entries(data)) {
    let note = "";
    if (value.note !== "") {
      note = "<button type=\"button\" class=\"btn btn-sm btn-outline-secondary\" data-bs-toggle=\"tooltip\" data-bs-placement=\"top\" title=\"" + value.note + "\">"
        + "<i class=\"bi bi-info-lg\"></i>"
        + "</button>";
    }

    $("#cutin table tbody").append("<tr>"
      + "<td>"
      + "<button class=\"btn btn-sm btn-outline-secondary\" data-bs-toggle=\"modal\" data-bs-target=\"#play-modal\""
      + " data-from-icon=\"" + escape(value.from.icon) + "\""
      + " data-from-member=\"" + value.from.name + "\""
      + " data-from-interaction=\"" + value.from.interaction + "\""
      + " data-to-icon=\"" + escape(value.to.icon) + "\""
      + " data-to-member=\"" + value.to.name + "\""
      + " data-to-interaction=\"" + value.to.interaction + "\""
      + " data-play-file=\"" + escape(value.file) + "\""
      + ">"
      + "<i class=\"bi bi-music-note-list\"></i>"
      + "</button>"
      + "</td>"

      + "<td>"
      + "<span class=\"badge me-2\" style=\"background-color: " + value.from.color + "\">" + value.from.name + "</span>"
      + value.from.interaction
      + "</td>"

      + "<td>"
      + "<span class=\"badge me-2\" style=\"background-color: " + value.to.color + "\">" + value.to.name + "</span>"
      + value.to.interaction
      + "</td>"

      + "<td>" + note + "</td>"
      + "</tr>");
  }

  $("#loading").addClass("d-none");
  $("#cutin").removeClass("d-none");
}

const eventPlayModal = (event) => {
  const button = event.relatedTarget;
  const from = {
    icon: button.getAttribute("data-from-icon"),
    member: button.getAttribute("data-from-member"),
    interaction: button.getAttribute("data-from-interaction"),
  };
  const to = {
    icon: button.getAttribute("data-to-icon"),
    member: button.getAttribute("data-to-member"),
    interaction: button.getAttribute("data-to-interaction"),
  };
  const playModal =$("div#play-modal");
  const playFrom = playModal.find("div.balloon.left");
  const playTo = playModal.find("div.balloon.right");
  playFrom.find("div.balloon-icon.text-center").html(unescape(from.icon));
  playFrom.find("div.balloon-member").html(from.member);
  playFrom.find("div.balloon-text").html(from.interaction);
  playTo.find("div.balloon-icon.text-center").html(unescape(to.icon));
  playTo.find("div.balloon-member").html(to.member);
  playTo.find("div.balloon-text").html(to.interaction);

  playModal.find("div.audio").html("<audio controls controlslist=\"nodownload\">"
    + "<source src=\"" + unescape(button.getAttribute("data-play-file")) + "\" type=\"audio/mpeg\">"
    + "</audio>");
}

const getShowFrom = () => {
  let result = {};
  for (let [key, value] of Object.entries(members)) {
    result[key] = true;
  }

  let checked = $("input.from-members:checked").map(function () {
    return $(this).val();
  }).get();

  if (checked.length !== 0) {
    for (let [key, value] of Object.entries(result)) {
      result[key] = false;
    }
    for (let cnt1 = 0; cnt1 < checked.length; cnt1++) {
      result[checked[cnt1]] = true;
    }
  }

  return result;
}

const getToFrom = () => {
  let result = {
  };
  for (let [key, value] of Object.entries(members)) {
    result[key] = true;
  }

  let checked = $("input.to-members:checked").map(function () {
    return $(this).val();
  }).get();

  if (checked.length !== 0) {
    for (let [key, value] of Object.entries(result)) {
      result[key] = false;
    }
    for (let cnt1 = 0; cnt1 < checked.length; cnt1++) {
      result[checked[cnt1]] = true;
    }
  }

  return result;
}

