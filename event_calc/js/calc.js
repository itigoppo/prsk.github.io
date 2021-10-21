$(function () {
    var bonus = 0;
    $('input:radio').change(function () {
        var card = $(this).parent().parent().attr('id');
        // PUならタイプボーナスとユニットボーナスはかならずある
        if ($(this).attr('name') === card + '-rare') {
            var rare = $(this).attr('id');
            rare = rare.replace(card + '-rare-', '');
            if (rare === 'pu') {
                $('input[id="'+ card + '-type-on"]').prop('checked', true);
                $('input[id="'+ card + '-unit-on"]').prop('checked', true);
            }
        }
        $('span#bonus').html(calc('card1') + calc('card2') + calc('card3') + calc('card4') + calc('card5'));
    });

    $('span#bonus').html(calc('card1') + calc('card2') + calc('card3') + calc('card4') + calc('card5'));
});

function calc(card)
{
    var rare = $('input[name="'+ card + '-rare"]:checked').attr('id');
    if (rare ?? false) {
        rare = rare.replace(card + '-rare-', '');
    }
    var rank = $('input[name="'+ card + '-master-rank"]:checked').attr('id');
    if (rank ?? false) {
        rank = rank.replace(card + '-master-rank', '');
    }
    var type = $('input[name="'+ card + '-type"]:checked').attr('id');
    if (type ?? false) {
        type = type.replace(card + '-type-', '');
    }
    var unit = $('input[name="'+ card + '-unit"]:checked').attr('id');
    if (unit ?? false) {
        unit = unit.replace(card + '-unit-', '');
    }

    var bonus = 0;
    if (type === 'on') {
        bonus += 25;
    }
    if (unit === 'on') {
        bonus += 25;
    }
    if (rare === 'pu') {
        bonus += 20;
    }

    var rankRate = {
        pu: 2,
        star4: 2,
        br: 1.5,
        star3: 1,
        star2: 0.2,
        star1: 0.1,
    };
    if (rankRate[rare] ?? false) {
        bonus += rankRate[rare] * rank;
    }

    $('#' + card + ' .h5>span').html(bonus);

    return bonus;
}
