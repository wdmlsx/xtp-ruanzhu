const injectJq = async function f() {
  const spt = document.createElement('script');
  spt.setAttribute('src', './reporter/jq.js');
  const scr = document.getElementsByTagName('script')[0];
  const body = document.getElementsByTagName('body')[0];
  body.insertBefore(spt, scr);
};

const delay = function(timeStamp) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, timeStamp)
  })
};
const test = async function() {
  await injectJq();
  await delay(200);


  const suitPathes = $('.suite-path');
  suitPathes.each(function() {
    const text = $(this).text().split('/').pop()
    $(this).text(text)
  })

  const tables = $('table');
  tables.attr('border', 1);
  tables.each(function() {
  });

  const suits = $('.suite');
  suits.remove();

  // 修改统计结果
  const resultTag = $('#summary');
  const result = resultTag.text();
  const format = getResult(result);
  resultTag.text(format);


  // 修改表格首列
  const tableList = $('tbody');
  tableList.each(function () {
    // const pdiv = $(this).pre
    let trsLength = 0;
    let failed = false;
    const trs = $(this).children('tr').each(function () {
      if ($(this).attr('class') === 'failed') {
        failed = true;
      }
      trsLength++
    });
    // const par = $(this).parent().prev().find('.suite-path').text().substring(0, 12);
    const reg = /[A-Z-]+\d-\d{4}/g;
    const par_txt = $(this).parent().prev().find('.suite-path').text().match(reg);
    const par = par_txt ? par_txt[0] :$(this).parent().prev().find('.suite-path').text();

    if (failed) {
      $(this).parent().prev().find('.suite-path').attr('class', 'suite-path-failed');
    }

    const td = $('<td></td>').text(par).attr('rowspan', trsLength).attr('class', 'suite').attr('valign', 'middle').attr('align', 'center');
    $(this).children('tr').first().children('td').first().before(td);
  })
};

function getResult(result) {
  const resultArr = result.split(' ').filter(ele => !isNaN(parseInt(ele))).map(ele => parseInt(ele));
  if (resultArr.length >= 4) {
    const total = resultArr[0];
    const passed = resultArr[1];
    const failed = resultArr[2];
    const pending = resultArr[3];
    const passedCent = (passed / total).toFixed(2) * 100;
    return '总测试例: ' + total + ' / 通过例: ' + passed + ' / 通过率: ' + passedCent + '%' + ' / 失败例: ' + failed;
  } else {
    return result;
  }
}
test();






























