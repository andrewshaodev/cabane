import { Path, Shape } from "three";

// Side silhouettes traced from the shortcut: x runs toward the muzzle, y is up.
const receiver = new Shape();
receiver.moveTo(-.205, .045);
receiver.bezierCurveTo(-.225, .13, -.165, .16, -.105, .145);
receiver.lineTo(.29, .12);
receiver.quadraticCurveTo(.335, .10, .30, .015);
receiver.quadraticCurveTo(.285, -.04, .21, -.053);
receiver.lineTo(.045, -.065);
receiver.quadraticCurveTo(-.02, -.085, -.105, -.065);
receiver.quadraticCurveTo(-.215, -.065, -.205, .045);
receiver.closePath();

const armor = new Shape();
armor.moveTo(-.205, .075);
armor.bezierCurveTo(-.213, .135, -.174, .163, -.105, .157);
armor.quadraticCurveTo(-.075, .155, -.039, .121);
armor.lineTo(.228, .116);
armor.quadraticCurveTo(.258, .12, .27, .147);
armor.lineTo(.318, .145);
armor.quadraticCurveTo(.335, .138, .32, .097);
armor.lineTo(.288, .018);
armor.quadraticCurveTo(.275, -.015, .235, -.014);
armor.lineTo(.139, -.022);
armor.quadraticCurveTo(.111, -.023, .09, .003);
armor.lineTo(.047, .047);
armor.lineTo(-.025, .044);
armor.bezierCurveTo(-.054, .094, -.098, .118, -.143, .093);
armor.quadraticCurveTo(-.184, .068, -.205, .075);
armor.closePath();

const grip = new Shape();
grip.moveTo(-.155, -.037);
grip.quadraticCurveTo(-.1, -.029, -.055, -.073);
grip.quadraticCurveTo(-.068, -.124, -.094, -.185);
grip.lineTo(-.127, -.293);
grip.quadraticCurveTo(-.124, -.322, -.158, -.325);
grip.lineTo(-.269, -.292);
grip.quadraticCurveTo(-.28, -.284, -.264, -.257);
grip.lineTo(-.188, -.087);
grip.quadraticCurveTo(-.19, -.048, -.155, -.037);
grip.closePath();

const gripInset = new Shape();
gripInset.moveTo(-.157, -.07);
gripInset.quadraticCurveTo(-.104, -.075, -.087, -.10);
gripInset.quadraticCurveTo(-.096, -.172, -.152, -.282);
gripInset.quadraticCurveTo(-.184, -.292, -.245, -.265);
gripInset.lineTo(-.179, -.112);
gripInset.quadraticCurveTo(-.17, -.073, -.157, -.07);
gripInset.closePath();

const heel = new Shape();
heel.moveTo(-.27, -.261);
heel.quadraticCurveTo(-.218, -.29, -.139, -.284);
heel.quadraticCurveTo(-.12, -.287, -.116, -.318);
heel.quadraticCurveTo(-.106, -.357, -.15, -.361);
heel.quadraticCurveTo(-.235, -.351, -.299, -.318);
heel.quadraticCurveTo(-.31, -.30, -.287, -.277);
heel.closePath();

const guard = new Shape();
guard.moveTo(-.085, -.055);
guard.lineTo(.11, -.053);
guard.bezierCurveTo(.166, -.09, .145, -.182, .076, -.186);
guard.lineTo(-.082, -.17);
guard.quadraticCurveTo(-.12, -.125, -.085, -.055);
guard.closePath();
const opening = new Path();
opening.moveTo(-.065, -.08);
opening.quadraticCurveTo(-.085, -.115, -.065, -.146);
opening.lineTo(.064, -.158);
opening.bezierCurveTo(.112, -.159, .14, -.116, .10, -.08);
opening.closePath();
guard.holes.push(opening);

const trigger = new Shape();
trigger.moveTo(-.017, -.058);
trigger.lineTo(.014, -.06);
trigger.quadraticCurveTo(-.004, -.115, .025, -.145);
trigger.quadraticCurveTo(-.013, -.152, -.032, -.111);
trigger.quadraticCurveTo(-.042, -.077, -.017, -.058);
trigger.closePath();

export const blasterContours = { receiver, armor, grip, gripInset, heel, guard, trigger };
