import { Component, OnInit } from '@angular/core';
import { PlayoutComponent } from '../playout/playout.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-credit',
  templateUrl: './credit.component.html',
  styleUrls: ['./credit.component.css']
})
export class CreditComponent implements OnInit {
  constructor(public PLAYERINFO: PlayoutComponent, private http: HttpClient) {this.PLAYERINFO.pageCharger = 1;}

  ngOnInit() {
    if (this.PLAYERINFO.playerInfo) {
      this.fetchCreditEvolution(this.PLAYERINFO.playerInfo.id);
    }
  }

  fetchCreditEvolution(playerId: number) {
    this.http.get<number[]>(`http://paul:8000/player/evolution/${playerId}`)
      .subscribe((data: number[]) => {
        this.drawChart(data);
      });
  }

  drawChart(data: number[]) {
    const canvas = <HTMLCanvasElement>document.getElementById('creditChart');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const chartHeight = canvas.height;
    const chartWidth = canvas.width;
    const padding = 50;
    const chartData = data.map((value, index) => {
      return {
        x: padding + (index / (data.length - 1)) * (chartWidth - 2 * padding),
        y: padding + ((maxValue - value) / (maxValue - minValue)) * (chartHeight - 2 * padding)
      };
    });

    ctx.clearRect(0, 0, chartWidth, chartHeight);
    ctx.beginPath();
    ctx.moveTo(chartData[0].x, chartData[0].y);
    chartData.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw points
    chartData.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'red';
      ctx.fill();
    });

    // Draw axes
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, chartHeight - padding);
    ctx.lineTo(chartWidth - padding, chartHeight - padding);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw unit labels
    const unitInterval = (maxValue - minValue) / 5;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 5; i++) {
      const unit = minValue + unitInterval * i;
      const yPosition = padding + ((maxValue - unit) / (maxValue - minValue)) * (chartHeight - 2 * padding);
      ctx.fillText(unit.toString(), padding - 5, yPosition);
    }
  }

  deconexion() {
    this.PLAYERINFO.playerInfo = null; // Vider playerInfo
    this.PLAYERINFO.joueurConnecter=false;
  }
}
