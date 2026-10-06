import { Path, Shape } from "three";

// Side silhouettes traced from the shortcut: x runs toward the muzzle, y is up.
const receiver = new Shape();
receiver.moveTo(-0.205, 0.045);
receiver.bezierCurveTo(-0.225, 0.13, -0.165, 0.16, -0.105, 0.145);
receiver.lineTo(0.29, 0.12);
receiver.quadraticCurveTo(0.335, 0.1, 0.3, 0.015);
receiver.quadraticCurveTo(0.285, -0.04, 0.21, -0.053);
receiver.lineTo(0.045, -0.065);
receiver.quadraticCurveTo(-0.02, -0.085, -0.105, -0.065);
receiver.quadraticCurveTo(-0.215, -0.065, -0.205, 0.045);
receiver.closePath();

const armor = new Shape();
armor.moveTo(-0.205, 0.075);
armor.bezierCurveTo(-0.213, 0.135, -0.174, 0.163, -0.105, 0.157);
armor.quadraticCurveTo(-0.075, 0.155, -0.039, 0.121);
armor.lineTo(0.228, 0.116);
armor.quadraticCurveTo(0.258, 0.12, 0.27, 0.147);
armor.lineTo(0.318, 0.145);
armor.quadraticCurveTo(0.335, 0.138, 0.32, 0.097);
armor.lineTo(0.288, 0.018);
armor.quadraticCurveTo(0.275, -0.015, 0.235, -0.014);
armor.lineTo(0.139, -0.022);
armor.quadraticCurveTo(0.111, -0.023, 0.09, 0.003);
armor.lineTo(0.047, 0.047);
armor.lineTo(-0.025, 0.044);
armor.bezierCurveTo(-0.054, 0.094, -0.098, 0.118, -0.143, 0.093);
armor.quadraticCurveTo(-0.184, 0.068, -0.205, 0.075);
armor.closePath();

const grip = new Shape();
grip.moveTo(-0.155, -0.037);
grip.quadraticCurveTo(-0.1, -0.029, -0.055, -0.073);
grip.quadraticCurveTo(-0.068, -0.124, -0.094, -0.185);
grip.lineTo(-0.127, -0.293);
grip.quadraticCurveTo(-0.124, -0.322, -0.158, -0.325);
grip.lineTo(-0.269, -0.292);
grip.quadraticCurveTo(-0.28, -0.284, -0.264, -0.257);
grip.lineTo(-0.188, -0.087);
grip.quadraticCurveTo(-0.19, -0.048, -0.155, -0.037);
grip.closePath();

const gripInset = new Shape();
gripInset.moveTo(-0.157, -0.07);
gripInset.quadraticCurveTo(-0.104, -0.075, -0.087, -0.1);
gripInset.quadraticCurveTo(-0.096, -0.172, -0.152, -0.282);
gripInset.quadraticCurveTo(-0.184, -0.292, -0.245, -0.265);
gripInset.lineTo(-0.179, -0.112);
gripInset.quadraticCurveTo(-0.17, -0.073, -0.157, -0.07);
gripInset.closePath();

const heel = new Shape();
heel.moveTo(-0.27, -0.261);
heel.quadraticCurveTo(-0.218, -0.29, -0.139, -0.284);
heel.quadraticCurveTo(-0.12, -0.287, -0.116, -0.318);
heel.quadraticCurveTo(-0.106, -0.357, -0.15, -0.361);
heel.quadraticCurveTo(-0.235, -0.351, -0.299, -0.318);
heel.quadraticCurveTo(-0.31, -0.3, -0.287, -0.277);
heel.closePath();

const guard = new Shape();
guard.moveTo(-0.085, -0.055);
guard.lineTo(0.11, -0.053);
guard.bezierCurveTo(0.166, -0.09, 0.145, -0.182, 0.076, -0.186);
guard.lineTo(-0.082, -0.17);
guard.quadraticCurveTo(-0.12, -0.125, -0.085, -0.055);
guard.closePath();
const opening = new Path();
opening.moveTo(-0.065, -0.08);
opening.quadraticCurveTo(-0.085, -0.115, -0.065, -0.146);
opening.lineTo(0.064, -0.158);
opening.bezierCurveTo(0.112, -0.159, 0.14, -0.116, 0.1, -0.08);
opening.closePath();
guard.holes.push(opening);

const trigger = new Shape();
trigger.moveTo(-0.017, -0.058);
trigger.lineTo(0.014, -0.06);
trigger.quadraticCurveTo(-0.004, -0.115, 0.025, -0.145);
trigger.quadraticCurveTo(-0.013, -0.152, -0.032, -0.111);
trigger.quadraticCurveTo(-0.042, -0.077, -0.017, -0.058);
trigger.closePath();

export const blasterContours = { receiver, armor, grip, gripInset, heel, guard, trigger };
