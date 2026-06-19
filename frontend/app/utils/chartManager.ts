import {
  ColorType,
  createChart as createLightWeightChart,
  CrosshairMode,
  ISeriesApi,
  UTCTimestamp,
} from "lightweight-charts";

export class ChartManager {
  private candleSeries: ISeriesApi<"Candlestick">;
  // private lastUpdateTime: number = 0;
  private chart: any;
  // private currentBar: {
  //   open: number | null;
  //   high: number | null;
  //   low: number | null;
  //   close: number | null;
  // } = {
  //   open: null,
  //   high: null,
  //   low: null,
  //   close: null,
  // };

  constructor(
    ref: any,
    initialData: any[],
    layout: { background: string; color: string },
  ) {
    const chart = createLightWeightChart(ref, {
      autoSize: true,
      overlayPriceScales: {
        ticksVisible: true,
        borderVisible: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        visible: true,
        ticksVisible: true,
        entireTextOnly: true,
      },
      grid: {
        horzLines: {
          visible: false,
        },
        vertLines: {
          visible: false,
        },
      },
      layout: {
        background: {
          type: ColorType.Solid,
          color: layout.background,
        },
        textColor: "white",
      },
    });
    this.chart = chart;
    this.candleSeries = chart.addCandlestickSeries();

    this.candleSeries.setData(
      initialData.map(({ timestamp, ...rest }) => ({
        ...rest,
        time: (timestamp.getTime() / 1000) as UTCTimestamp,
      })),
    );
  }
  public update(updatedPrice: any) {
    // if (!this.lastUpdateTime) {
    //   this.lastUpdateTime = new Date().getTime();
    // }

    console.log(
      "chart update time:",
      updatedPrice.time,
      "candle:",
      updatedPrice,
    );

    this.candleSeries.update({
      time: updatedPrice.time as UTCTimestamp,
      close: updatedPrice.close,
      low: updatedPrice.low,
      high: updatedPrice.high,
      open: updatedPrice.open,
    });

    // if (updatedPrice.newCandleInitiated) {
    //   this.lastUpdateTime = updatedPrice.time;
    // }
  }
  public destroy() {
    this.chart.remove();
  }
}
