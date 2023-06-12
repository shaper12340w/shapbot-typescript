import { createCanvas, loadImage } from "canvas";
import { hexToRgba } from "../common/extras";

export async function welcomeImage(username:string,image:string,background?:string) {

    const width = 350;
    const height = 160;

    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    const circle = {
        x: Math.round(width/4),
        y: (height/2),
        radius: 37,
    }
    //배경화면 채우기(배경/검정 가까운 네모판)
    if(background){
        try{
            const backImage = await loadImage(background);
            context.drawImage(backImage,0, 0, width, height);

        } catch(e) {
            throw new Error("링크가 잘못되었습니다")
        }
    } else {
        context.fillStyle = "#343d45";
        context.fillRect(0, 0, width, height);
    }
    context.fillStyle = hexToRgba("#000000",0.3);
    context.fillRect(10, 10, width-20, height-20);

    context.font = '15pt PT Sans';
    context.fillStyle = "#FFFFFF";

    const welcome = "Welcome!";
    context.fillText(welcome, width/2-10, (height/2)-10);

    // 선 스타일 설정
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 5;

    // 시작점과 끝점 설정
    const startX = (width/2)-10;
    const startY = (height/2)+5;
    const endX = width-35;
    const endY = (height/2)+6;

    // 선 그리기
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();

    context.font = '11pt sans-serif';
    context.fillStyle = "#FFFFFF";

    const text = `${username} join this server!`
    context.fillText(text, width/2-10, (height/2)+30);

    context.beginPath();
    context.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2, true);
    context.closePath();
    context.clip();

    const avatar = await loadImage(image);
    console.log(avatar.height, avatar.width);
    const aspect = avatar.height / avatar.width;
    const hsx = circle.radius * Math.max(1.0 / aspect, 1.0);
    const hsy = circle.radius * Math.max(aspect, 1.0);
    context.drawImage(avatar, circle.x - hsx, circle.y - hsy, hsx * 2, hsy * 2);
    const buffer = canvas.toBuffer("image/png");
    return buffer;
}