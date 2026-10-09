const ids = ['i_1_1', 'i_1_2', 'i_2_1', 'i_2_2', 'i_2_3', 'i_2_4', 'i_3_1', 'i_3_2', 'i_3_3', 'i_4_1', 'i_4_2', 'ii_1_1', 'ii_1_2', 'ii_1_3', 'ii_1_4', 'ii_1_5', 'ii_1_6', 'ii_1_7', 'ii_2_1', 'ii_2_2', 'ii_3_1', 'ii_3_2', 'ii_3_3', 'ii_3_4', 'ii_4_1', 'ii_4_2', 'ii_5_1', 'ii_5_2', 'ii_5_3', 'ii_5_4', 'ii_6_1', 'ii_6_2', 'ii_6_3', 'ii_6_4', 'iii_1', 'iii_2', 'iii_3', 'iii_4', 'iv_1_1', 'iv_1_2', 'iv_1_3', 'iv_2_1', 'iv_2_2', 'iv_2_3', 'iv_2_4', 'iv_2_5', 'v_1', 'v_2'];
const newChecklist = {};
ids.forEach(id => newChecklist[id] = true);
console.log(Object.keys(newChecklist).length);
