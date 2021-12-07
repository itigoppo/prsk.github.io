let members = [];
let sortMembers = [];
let parent = [];
let rec = [];
let equal = [];
let totalSize;
let nrec;
let cmp1, cmp2;
let head1, head2;
let numQuestion;
let finishSize;
let isFinish;

$(function () {
    loadMembers();
    init();
    showBattle();
    showDefault();

    $("#reset").on("click", function () {
        init();
        showBattle();
        showDefault();
    });

    $("#leftField").on("click", function () {
        if (!isFinish) {
            calc(-1);
        }
    });
    $("#rightField").on("click", function () {
        if (!isFinish) {
            calc(1);
        }
    });
    $("#middleField").on("click", function () {
        if (!isFinish) {
            calc(0);
        }
    });

    // ページのトップに移動
    $("#pagetop").on("click", function () {
        $('html, body').animate({ scrollTop: 0 }, 500);
    });
});

const loadMembers = () => {
    const units = {};

    $.ajaxSetup({async: false}); // 同期通信(json取ってくるまで待つ)
    $.getJSON("../data/units.json", function (data) {
        $(data.units).each(function () {
            units[this.id] = {
                name: this.unit,
                color: this.color,
                sp_bg: this.sp_bg,
            };
        });
    });

    $.getJSON("../data/members.json", function (data) {
        $(data.members).each(function () {
            const unit = units[this.unit_id];
            const member = {
                id: this.id,
                name: this.member,
                image: this.image,
                unit: unit,
            };
            members.push(member);
        });
    });
    $.ajaxSetup({async: true}); // 非同期に戻す
}

const init = () => {
    let cnt1 = 0;
    sortMembers[cnt1] = [];
    for (let cnt2 = 0; cnt2 < members.length; cnt2++) {
        sortMembers[cnt1][cnt2] = cnt2;
    }
    parent[cnt1] = -1;
    totalSize = 0;
    cnt1++;

    for (let cnt2 = 0; cnt2 < sortMembers.length; cnt2++) {
        if (sortMembers[cnt2].length >= 2) {
            const mid = Math.ceil(sortMembers[cnt2].length / 2);
            sortMembers[cnt1] = [];
            sortMembers[cnt1] = sortMembers[cnt2].slice(0, mid);
            totalSize += sortMembers[cnt1].length;
            parent[cnt1] = cnt2;
            cnt1++;
            sortMembers[cnt1] = [];
            sortMembers[cnt1] = sortMembers[cnt2].slice(mid, sortMembers[cnt2].length);
            totalSize += sortMembers[cnt1].length;
            parent[cnt1] = cnt2;
            cnt1++;
        }
    }

    for (let cnt2 = 0; cnt2 < members.length; cnt2++) {
        rec[cnt2] = 0;
    }
    nrec = 0;

    for (let cnt2 = 0; cnt2 < members.length; cnt2++) {
        equal[cnt2] = -1;
    }

    cmp1 = sortMembers.length - 2;
    cmp2 = sortMembers.length - 1;
    head1 = 0;
    head2 = 0;
    numQuestion = 1;
    finishSize = 0;
    isFinish = false;
}

const showProgress = () => {
    const rate = Math.floor(finishSize * 100 / totalSize);
    const progress = $("#result-progress");
    $("#battleNumber").html("Battle No." + numQuestion + " ## " + rate + "% sorted.");
    progress.css("width", rate + "%");
    progress.prop("aria-valuenow", rate);
}

const showBattle = () => {
    showProgress();

    $("#leftField").html(toNameFace(sortMembers[cmp1][head1]));
    $("#rightField").html(toNameFace(sortMembers[cmp2][head2]));

    numQuestion++;
}

const toNameFace = (memberId) => {
    const member = members[memberId];

    return "<div class=\"card-body text-center\">"
        + "<img src=\"" + member.image + "\" class=\"card-img-top w-50\" alt=\"" + member.name + "\">"
        + "<p class=\"card-text mt-3\">"
        + "<i class=\"bi bi-x-diamond-fill\" style=\"color: " + member.unit.color + "\"></i> "
        + member.name + " (" + member.unit.name + ")"
        + "</p></div>";
}

const calc = (index) => {
    if (index < 0) {
        rec[nrec] = sortMembers[cmp1][head1];
        head1++;
        nrec++;
        finishSize++;
        while (equal[rec[nrec - 1]] !== -1) {
            rec[nrec] = sortMembers[cmp1][head1];
            head1++;
            nrec++;
            finishSize++;
        }
    } else if (index > 0) {
        rec[nrec] = sortMembers[cmp2][head2];
        head2++;
        nrec++;
        finishSize++;
        while (equal[rec[nrec - 1]] !== -1) {
            rec[nrec] = sortMembers[cmp2][head2];
            head2++;
            nrec++;
            finishSize++;
        }
    } else {
        rec[nrec] = sortMembers[cmp1][head1];
        head1++;
        nrec++;
        finishSize++;
        while (equal[rec[nrec - 1]] !== -1) {
            rec[nrec] = sortMembers[cmp1][head1];
            head1++;
            nrec++;
            finishSize++;
        }
        equal[rec[nrec - 1]] = sortMembers[cmp2][head2];
        rec[nrec] = sortMembers[cmp2][head2];
        head2++;
        nrec++;
        finishSize++;
        while (equal[rec[nrec - 1]] !== -1) {
            rec[nrec] = sortMembers[cmp2][head2];
            head2++;
            nrec++;
            finishSize++;
        }
    }

    if (head1 < sortMembers[cmp1].length && head2 === sortMembers[cmp2].length) {
        while (head1 < sortMembers[cmp1].length) {
            rec[nrec] = sortMembers[cmp1][head1];
            head1++;
            nrec++;
            finishSize++;
        }
    } else if (head1 === sortMembers[cmp1].length && head2 < sortMembers[cmp2].length) {
        while (head2 < sortMembers[cmp2].length) {
            rec[nrec] = sortMembers[cmp2][head2];
            head2++;
            nrec++;
            finishSize++;
        }
    }

    if (head1 === sortMembers[cmp1].length && head2 === sortMembers[cmp2].length) {
        for (let cnt1 = 0; cnt1 < sortMembers[cmp1].length + sortMembers[cmp2].length; cnt1++) {
            sortMembers[parent[cmp1]][cnt1] = rec[cnt1];
        }
        sortMembers.pop();
        sortMembers.pop();
        cmp1 = cmp1 - 2;
        cmp2 = cmp2 - 2;
        head1 = 0;
        head2 = 0;

        if (head1 === 0 && head2 === 0) {
            for (let cnt1 = 0; cnt1 < members.length; cnt1++) {
                rec[cnt1] = 0;
            }
            nrec = 0;
        }
    }

    if (cmp1 < 0) {
        showResult();
        isFinish = true;
    } else {
        showBattle();
    }
}

const showDefault = () => {
    let showMember = "";
    for (let [key, value] of Object.entries(members)) {
        showMember += "<div class=\"col-md-3 col-sm-6 my-1\"><div class=\"card\">" + toNameFace(key) + "</div></div>";
    }

    const resultField = $("#resultField");
    resultField.html("<hr />チェック対象メンバー" + members.length + "人<br />");
    resultField.append("<div class=\"row\">" + showMember + "</div>");
}

const showResult = () => {
    showProgress();

    let result = "";
    result += "<table id=\"result\" class=\"table table-sm table-striped\">";
    result += "<thead>";
    result += "<tr><th>順位</th><th>名前</th></tr>";
    result += "</thead>";
    result += "<tbody>";
    result += "</tbody>";
    result += "</table>";
    $("#resultField").html(result);

    let ranking = 1;
    let sameRank = 1;
    for (let cnt1 = 0; cnt1 < members.length; cnt1++) {
        $("#result").append("<tr><td>" + ranking + "</td><td>"
            + "<i class=\"bi bi-x-diamond-fill\" style=\"color: " + members[sortMembers[0][cnt1]].unit.color + "\"></i> "
            + members[sortMembers[0][cnt1]].name + " (" + members[sortMembers[0][cnt1]].unit.name + ")"
            + "</td></tr>");
        if (cnt1 < members.length - 1) {
            if (equal[sortMembers[0][cnt1]] === sortMembers[0][cnt1 + 1]) {
                sameRank++;
            } else {
                ranking += sameRank;
                sameRank = 1;
            }
        }
    }
}
