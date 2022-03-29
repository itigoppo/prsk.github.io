$(function () {
  $('input:radio').change(function () {
    const card = $(this).parent().parent().attr('id');
    // PUならタイプボーナスとユニットボーナスはかならずある
    if ($(this).attr('name') === card + '-rare') {
      let rare = $(this).attr('id');
      rare = rare.replace(card + '-rare-', '');
      if (rare === 'pu') {
        $('input[id="' + card + '-type-on"]').prop('checked', true);
        $('input[id="' + card + '-unit-on"]').prop('checked', true);
      }
    }
    $('span#bonus').html(calc('card1') + calc('card2') + calc('card3') + calc('card4') + calc('card5'));
  });

  $('span#bonus').html(calc('card1') + calc('card2') + calc('card3') + calc('card4') + calc('card5'));
});

const calc = (card) => {
  let rare = $('input[name="' + card + '-rare"]:checked').attr('id');
  if (rare ?? false) {
    rare = rare.replace(card + '-rare-', '');
  }
  let rank = $('input[name="' + card + '-master-rank"]:checked').attr('id');
  if (rank ?? false) {
    rank = rank.replace(card + '-master-rank', '');
  }
  let type = $('input[name="' + card + '-type"]:checked').attr('id');
  if (type ?? false) {
    type = type.replace(card + '-type-', '');
  }
  let unit = $('input[name="' + card + '-unit"]:checked').attr('id');
  if (unit ?? false) {
    unit = unit.replace(card + '-unit-', '');
  }

  let bonus = 0;
  if (type === 'on') {
    bonus += 25;
  }
  if (unit === 'on') {
    bonus += 25;
  }
  if (unit === 'vs') {
    bonus += 15;
  }
  if (rare === 'pu') {
    bonus += 20;
  }

  const rankRate = {
    pu: [0, 10, 11, 12, 13, 15],
    star4: [0, 10, 11, 12, 13, 15],
    br: [0, 5, 6, 7, 8, 10],
    star3: [0, 1, 2, 3, 4, 5],
    star2: [0, 0.2, 0.4, 0.6, 0.8, 1],
    star1: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
  };
  if (rankRate[rare] ?? false) {
    bonus += rankRate[rare][rank];
  }

  $('#' + card + ' .h5>span').html(bonus);

  return bonus;
}
