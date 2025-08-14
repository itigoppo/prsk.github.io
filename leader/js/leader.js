let sharedData = {
  transformed: [],
  unitMap: {},
  memberMap: {},
};

$(async () => {
  // 表示切り替え：ローディングを表示し、コンテンツ非表示
  $("#loading").removeClass("d-none");
  $("#content").addClass("d-none");

  // データ読み込み
  await loadAllData();

  // 年オプションを生成
  populateYearOptions("lineChartMonthRangeSelect");
  searchMember("lineChartMember");
  populateYearOptions("diffBarChartMonthRangeSelect");
  searchMember("diffBarChartMember");

  drawDualAxisChart("lineChart", {
    title: "リーダー回数の推移",
  });

  drawMemberStackedDiffChart("diffBarChart", {
    title: "リーダー回数の差分",
  });

  renderDiffTable("diffTableContainer");

  // 高さ調整におかわり描画
  setTimeout(() => {
    drawDualAxisChart("lineChart", {
      title: "リーダー回数の推移",
    });
    drawMemberStackedDiffChart("diffBarChart", {
      title: "リーダー回数の差分",
    });

    $("#loading").addClass("d-none");
    $("#content").removeClass("d-none");
  }, 100);

  $("#lineChartSearch select").on("change", function () {
    drawDualAxisChart("lineChart", {
      title: "リーダー回数の推移",
    });
  });
  $("#lineChartSearch input").on("change", function () {
    drawDualAxisChart("lineChart", {
      title: "リーダー回数の推移",
    });
  });
  $("#diffBarChartSearch select").on("change", function () {
    drawMemberStackedDiffChart("diffBarChart", {
      title: "リーダー回数の差分",
    });
  });
  $("#diffBarChartSearch input").on("change", function () {
    drawMemberStackedDiffChart("diffBarChart", {
      title: "リーダー回数の差分",
    });
  });
});

const loadAllData = async () => {
  const csv = await fetchCSVData();
  const transformed = transformCSVData(csv.headers, csv.dates, csv.data);
  const units = await fetchUnitData();
  const members = await fetchMemberData();

  sharedData.transformed = transformed;
  sharedData.unitMap = units;
  sharedData.memberMap = members;
};

const fetchCSVData = async () => {
  const url =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vR2sr6h2GYTH3EK2H-H6K8p785Bz-rY20PPL3wln3Wof1BOJhLpxIQLh_NPWWJ7ZFyiSrq8yPLt6x52/pub?gid=1850065451&single=true&output=csv";
  const res = await fetch(url);
  const text = await res.text();
  const parsed = parseCSVData(text);

  const headers = parsed[0].slice(1); // メンバーID（1行目の2列目以降）
  const dates = parsed.slice(1).map((r) => r[0]); // 日付
  const data = parsed.slice(1).map((r) => r.slice(1)); // データ

  return { headers, dates, data };
};

const parseCSVData = (text) => {
  const rows = text
    .trim()
    .split("\n")
    .map((r) => r.split(",").map((cell) => cell.trim()));
  return rows;
};

const fetchUnitData = async () => {
  const url = "../data/json/units.json";
  const res = await fetch(url);
  const data = await res.json();

  const unitMap = {};
  for (const u of data.units) {
    unitMap[u.id] = {
      id: u.id,
      name: u.short,
      color: u.color,
    };
  }

  return unitMap;
};

const fetchMemberData = async () => {
  const url = "../data/json/members.json";
  const res = await fetch(url);
  const data = await res.json();

  const memberMap = {};
  for (const m of data.members) {
    if (!m.is_active) {
      continue;
    }

    if (
      m.unit_id !== 1 &&
      ["miku", "rin", "len", "luka", "meiko", "kaito"].some((name) =>
        m.id.includes(name)
      )
    ) {
      continue;
    }

    memberMap[m.id] = {
      id: m.id,
      name: m.member,
      color: m.color,
      unitId: m.unit_id,
    };
  }
  memberMap["total"] = {
    id: "total",
    name: "合計",
    color: "#5B6369",
    unitId: 0,
  };

  return memberMap;
};

const transformCSVData = (headers, dates, rawData) => {
  const result = {};
  let prevData = null;

  for (let i = 0; i < dates.length; i++) {
    const rawDate = dates[i];
    const row = rawData[i];

    // 集計対象月に変換（例: 2025/02/07 → 2025-01）
    const dateObj = new Date(rawDate);
    dateObj.setMonth(dateObj.getMonth() - 1);

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const ym = `${year}-${month}`;

    const currentRow = {};
    let total = 0;

    for (let j = 0; j < headers.length; j++) {
      const memberId = headers[j];
      const value = parseInt(row[j], 10);
      currentRow[memberId] = isNaN(value) ? 0 : value;
      total += currentRow[memberId];
    }

    // 合計
    currentRow["total"] = total;

    // 増加量（前月との差）
    if (prevData) {
      currentRow["diff"] = {};

      for (const memberId of headers) {
        const diff = currentRow[memberId] - prevData[memberId];
        currentRow["diff"][memberId] = diff;
      }

      currentRow["diff"]["total"] = currentRow["total"] - prevData["total"];
    } else {
      currentRow["diff"] = null; // 初回は増加量なし
    }

    result[ym] = currentRow;
    prevData = currentRow;
  }

  return result;
};

const populateYearOptions = (elementId) => {
  const yearSet = new Set();

  for (const ym of Object.keys(sharedData.transformed)) {
    const year = ym.split("-")[0];
    yearSet.add(year);
  }

  const sortedYears = Array.from(yearSet).sort((a, b) => b - a); // 降順（最近の年を上に）

  const select = $(`#${elementId}`);

  for (const year of sortedYears) {
    const label = `${year}年`;
    const option = new Option(label, year);
    select.append(option);
  }
};

const searchMember = (elementId, hideTotal = false) => {
  const space = $(`#${elementId}`);
  Object.values(sharedData.memberMap)
    .filter((member) => {
      if (hideTotal && member.id === "total") {
        return false;
      }
      return true;
    })
    .forEach((member) => {
      space.append(`<div class="form-check form-check-inline">
      <label class="btn btn-sm" for="${elementId}_${member.id}" style="background-color: ${member.color}">
        <input type="checkbox" class="form-check-input" id="${elementId}_${member.id}" value="${member.id}" autocomplete="off">
        ${member.name}
      </label>
    </div>`);
    });
};

const resetCanvasSize = (canvasId, height = 500) => {
  const canvas = document.getElementById(canvasId);
  canvas.height = height;
};

const drawDualAxisChart = (canvasId, options = {}) => {
  resetCanvasSize(canvasId);
  const ctx = document.getElementById(canvasId).getContext("2d");
  let labels = Object.keys(sharedData.transformed).sort(); // e.g. 2025-01

  const checkedMembers = $('#lineChartMember input[type="checkbox"]:checked');
  let memberIds = [];
  if (checkedMembers.length === 0) {
    // 1つも選択されていない → 全ての value を取得
    memberIds = $('#lineChartMember input[type="checkbox"]')
      .map(function () {
        return this.value;
      })
      .get();
  } else {
    // 1つ以上選択されている → 選択されている value を取得
    memberIds = checkedMembers
      .map(function () {
        return this.value;
      })
      .get();
  }

  const monthRange = $("#lineChartMonthRangeSelect").val() || "all";
  if (monthRange !== "all") {
    if (/^\d{4}$/.test(monthRange)) {
      labels = labels.filter((label) => label.startsWith(`${monthRange}-`));
    } else {
      labels = labels.slice(-parseInt(monthRange, 10));
    }
  }

  // 各メンバーのデータと最大値を取得
  const valueMap = memberIds.map((memberId) => {
    const dataPoints = labels.map(
      (ym) => sharedData.transformed[ym]?.[memberId] ?? null
    );
    const maxVal = Math.max(...dataPoints.filter((v) => v !== null));
    return { memberId, dataPoints, max: maxVal };
  });

  const filteredValueMap = valueMap.filter((v) => v.memberId !== "total");
  const maxValWithoutTotal = Math.max(...filteredValueMap.map((v) => v.max));
  const minValWithoutTotal = Math.min(...filteredValueMap.map((v) => v.max));

  // 条件：3人以上 + 差が大きい(3倍以上)
  const useDualAxis =
    memberIds.length >= 3 &&
    minValWithoutTotal > 0 &&
    maxValWithoutTotal / minValWithoutTotal >= 3;

  const rightAxisIds = ["total"];

  if (useDualAxis) {
    const otherRightIds = filteredValueMap
      .filter((v) => v.max >= maxValWithoutTotal * 0.7)
      .map((v) => v.memberId);
    rightAxisIds.push(...otherRightIds);
  }

  // Y軸の振り分け: 高い値は右軸、それ以外は左軸
  const datasets = valueMap.map(({ memberId, dataPoints }) => {
    const member = sharedData.memberMap[memberId] || {
      name: memberId,
      color: "#ccc",
    };
    const useRightAxis = rightAxisIds.includes(memberId);

    return {
      label: member.name,
      data: dataPoints,
      borderColor: member.color,
      backgroundColor: useRightAxis ? member.color : "#ffffff",
      yAxisID: useRightAxis ? "yRight" : "yLeft",
      tension: 0.3,
      spanGaps: true,
      pointStyle: useRightAxis ? "rectRot" : "circle", // ◀ ポイントの形状変更
      pointRadius: useRightAxis ? 5 : 3,
      pointHoverRadius: useRightAxis ? 7 : 5,
      borderWidth: useRightAxis ? 2 : 1.5,
    };
  });

  // 既存グラフがあれば破棄（再描画対応）
  if (ctx.chart) {
    ctx.chart.destroy();
  }

  // 軸設定
  const scales = {
    yLeft: {
      type: "linear",
      position: "left",
      title: {
        display: true,
        text: "回数",
      },
    },
  };

  if (useDualAxis) {
    scales.yRight = {
      type: "linear",
      position: "right",
      title: {
        display: true,
        text: "合計/上位メンバー",
      },
      grid: {
        drawOnChartArea: false,
      },
    };
  }

  ctx.chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!options.title,
          text: options.title || "",
        },
        legend: {
          position: "bottom",
        },
      },
      scales,
    },
  });
};

const drawMemberStackedDiffChart = (canvasId, options = {}) => {
  resetCanvasSize(canvasId, 700);
  const ctx = document.getElementById(canvasId).getContext("2d");
  let yms = Object.keys(sharedData.transformed).sort().slice(1); // e.g. 2025-01

  const checkedMembers = $(
    '#diffBarChartMember input[type="checkbox"]:checked'
  );
  let memberIds = [];
  if (checkedMembers.length === 0) {
    // 1つも選択されていない → 全ての value を取得
    memberIds = $('#diffBarChartMember input[type="checkbox"]')
      .map(function () {
        return this.value;
      })
      .get()
      .filter((id) => id !== "total");
  } else {
    // 1つ以上選択されている → 選択されている value を取得
    memberIds = checkedMembers
      .map(function () {
        return this.value;
      })
      .get();
  }

  const monthRange = $("#diffBarChartMonthRangeSelect").val() || "all";
  if (monthRange !== "all") {
    if (/^\d{4}$/.test(monthRange)) {
      yms = yms.filter((label) => label.startsWith(`${monthRange}-`));
    } else {
      yms = yms.slice(-parseInt(monthRange, 10));
    }
  }

  // Y軸ラベルとしてメンバー名
  const labels = memberIds.map((id) => sharedData.memberMap[id]?.name || id);

  // 年月ごとに1つのdatasetを作成（各バーを積み上げ）
  const datasets = yms.map((ym) => {
    return {
      label: ym, // データセット＝1つの年月
      data: memberIds.map((memberId) => {
        return sharedData.transformed[ym]?.diff?.[memberId] ?? 0;
      }),
      backgroundColor: getColorForMonth(ym),
      stack: "stack1",
    };
  });

  // 既存グラフがあれば破棄
  if (ctx.chart) ctx.chart.destroy();

  // 横棒グラフを描画
  ctx.chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels, // Y軸（horizontal）に表示されるメンバー名
      datasets, // X軸方向に積み上がる年月ごとのdiff
    },
    options: {
      indexAxis: "y", // ★ ここで横棒に！
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!options.title,
          text: options.title || "メンバー別・年月ごとの差分（積み上げ横棒）",
        },
        legend: {
          position: "bottom",
        },
        tooltip: {
          mode: "nearest", // ← 1点だけ表示
          intersect: true, // ← 実際に当たってるバーのみ
          callbacks: {
            title: function (tooltipItems) {
              const memberLabel = tooltipItems[0]?.label || "";
              return memberLabel; // メンバー名
            },
            label: function (tooltipItem) {
              const ym = tooltipItem.dataset.label; // 年月
              const value = tooltipItem.raw; // 値
              return `${ym}: ${value}`;
            },
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          beginAtZero: true,
          title: {
            display: true,
            text: "差分（回数）",
          },
        },
        y: {
          stacked: true,
          title: {
            display: true,
            text: "メンバー",
          },
        },
      },
    },
  });
};

const getColorForMonth = (ym) => {
  const [yearStr, monthStr] = ym.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // 固定の色相テーブル（色相を分散させて近い色を避ける）
  const monthHues = [
    0, // Jan: 赤
    170, // Feb: 青緑
    30, // Mar: オレンジ
    250, // Apr: 青紫
    100, // May: 黄緑
    280, // Jun: 紫
    50, // Jul: 黄
    190, // Aug: 水色
    130, // Sep: 緑
    320, // Oct: 濃ピンク
    220, // Nov: 青
    20, // Dec: 濃橙/茶
  ];

  const hue = monthHues[month - 1];

  // 年ごとのトーン：交互に濃淡変化
  const isEvenYear = year % 2 === 0;
  const saturation = isEvenYear ? 90 : 50;
  const lightness = isEvenYear ? 50 : 80;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const renderDiffTable = (containerId) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  const transformed = sharedData.transformed;
  const memberMap = sharedData.memberMap;

  const months = Object.keys(transformed).sort().slice(1);
  const latestMonth = months[months.length - 1];

  // メンバー一覧を取得（diffがあるもの）
  const memberIds = Object.keys(memberMap);

  // ヘッダー行
  let html = `<table class="table table-bordered table-sm table-striped table-hover table-nowrap">`;
  html += `<thead><tr><th class="sticky-col">メンバー</th>`;
  months.forEach((ym) => {
    html += `<th class="text-nowrap">${ym}</th>`;
  });
  html += `<th class="text-nowrap">現在回数</th>`;
  html += `<th class="text-nowrap">平均</th>`;
  html += `</tr></thead><tbody>`;

  // 各メンバーの行
  memberIds.forEach((memberId) => {
    const memberName = memberMap[memberId]?.name || memberId;
    const color = memberMap[memberId]?.color || "#ccc";
    html += `<tr><th class="text-nowrap sticky-col" style="background-color: ${color}; color: white;">${memberName}</th>`;

    let totalDiff = 0;
    let diffCount = 0;

    months.forEach((ym) => {
      const diff = transformed[ym]?.diff?.[memberId] ?? null;

      if (diff === null) {
        html += "<td>-</td>";
      } else {
        const mark =
          memberId === "total"
            ? ""
            : diff > 0
            ? ` <i class="bi bi-caret-up-fill text-warning"></i>`
            : "";
        html += `<td class="text-end text-nowrap">${diff}${mark}</td>`;

        totalDiff += diff;
        diffCount++;
      }
    });
    const currentValue = transformed[latestMonth]?.[memberId] ?? "-";
    const averageDiff =
      diffCount > 0 ? Math.round((totalDiff / diffCount) * 10) / 10 : "-";

    html += `<td class="text-end text-nowrap" style="background-color: ${color}; color: white;">${currentValue}</td>`;
    html += `<td class="text-end text-nowrap">${averageDiff}</td>`;
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
};
