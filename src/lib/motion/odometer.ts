/**
 * 動きの参考 070(回転式カウンター):各桁の輪の位置(0〜10。10 は 0 と同じ所を 1 周したところ)を、上の桁から返す。
 * 1 の位は値の小数のまま回り、上の桁の輪は「1 つ下の輪が 9 を越えて回っている分」だけ一緒に回る(機械式の繰り上がり)。
 * 値が整数なら、どの輪もちょうど数字の位置に止まる(数え上げの終わりで輪がずれない)。
 */
export function odometerWheels(value: number, places: number): number[] {
  const v = Number.isFinite(value) && value > 0 ? value : 0;
  const wheels: number[] = [];
  let lower = v % 10; // 1 の位の輪
  wheels.push(lower);
  for (let k = 1; k < places; k++) {
    const digit = Math.floor(v / 10 ** k) % 10;
    lower = digit + Math.max(0, lower - 9);
    wheels.push(lower);
  }
  return wheels.reverse();
}
