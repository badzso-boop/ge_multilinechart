import * as d3 from "d3"
import Slider from '@mui/material/Slider';
import TrendsModal from "./TrendsModal";
import React, { useRef, useEffect, useState } from "react"

// Marker ikonok
import Covid from "../images/covid.png"
import Valsag from "../images/valsag.png"

// Egyetlen pont típusa
interface LineDataPoint {
  x: number // Időbélyeg (timestamp)
  y: number // Érték (pl. összeg, darabszám)
}

// Egy vonalsorozat típusa
export interface LineSeries {
  id: string              // vonal neve (pl. család neve)
  values: LineDataPoint[] // pontok a vonalon
  color: string           // szín
  currency: string        // pénznem
  socialClass: SocialClass
}

type SocialClass = "lower" | "middle" | "high";

const MultiLineChart: React.FC = () => {
  const ref = useRef<SVGSVGElement | null>(null)

   // --- Segédfüggvények ---
  const dateToTimestamp = (date: Date) => date.getTime();
  const timestampToDateString = (timestamp: number) => new Date(timestamp).toISOString().slice(0, 10);

  const formatDateUS = (date: Date) => {
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${monthNames[d.getMonth()]} ${day}, ${d.getFullYear()}`
  }

  // --- "Last 6 months" gomb ---
  function Last6Month() {
    setRangeVisible(false);

    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    setDateRange([
      dateToTimestamp(sixMonthsAgo),
      dateToTimestamp(today),
    ]);
  }

  // --- Slider esemény ---
  const handleChange = (event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      setDateRange(newValue as [number, number]);
    }
  };

  // --- Alap dátumtartomány ---
  const startDate = new Date(2005, 0, 1)
  const endDate = new Date(2025, 8, 31)
  const [dateRange, setDateRange] = useState<[number, number]>([
    dateToTimestamp(startDate),
    dateToTimestamp(endDate),
  ])

  
  const [hoverWidth, setHoverWidth] = useState(15);
  const [rangeVisible, setRangeVisible] = useState(true);

  // --- Pénznemek és árfolyamok ---
  const currencies = ["USD", "EUR", "GBP"] as const;
  const exchangeRates: Record<typeof currencies[number], number> = {
    USD: 1,
    EUR: 0.86,
    GBP: 0.74,
  };

  // --- Random adatgenerálás családokra ---
  function generateYearlyData(
    id: string,
    color: string,
    base: number,
    volatility: number,
    currency: string,
    socialClass: SocialClass
  ): LineSeries {
    const values: LineDataPoint[] = [];
    const date = new Date(2005, 0, 1);
    const endDate = new Date(2025, 0, 1);

    const getTrend = () => {
      if (socialClass === "lower") return 20 + Math.random() * 30;
      if (socialClass === "middle") return 50 + Math.random() * 100;
      if (socialClass === "high") return 100 + Math.random() * 100;
      return 0;
    };

    while (date <= endDate) {
      // Január
      const jan = new Date(date);
      let y = base + (Math.random() - 0.5) * (volatility * 0.5) +
              (jan.getFullYear() - 2005) * getTrend();

      // 2008-2009 válság hatása
      if ([2008, 2009].includes(jan.getFullYear())) {
        if (socialClass === "lower") y *= 0.8 + Math.random() * 0.05;
        if (socialClass === "middle") y *= 0.85 + Math.random() * 0.05;
        if (socialClass === "high") y *= 0.9 + Math.random() * 0.05;
      }

      // Covid hatása 2021-ben
      if (jan.getFullYear() === 2021) {
        if (socialClass === "lower") y *= 0.95 + Math.random() * 0.05;
        if (socialClass === "middle") y *= 0.95 + Math.random() * 0.1;
        if (socialClass === "high") y *= 1.1 + Math.random() * 0.1;
      }

      values.push({ x: jan.getTime(), y });

      // Július
      const jul = new Date(date);
      jul.setMonth(6);
      y = base + (Math.random() - 0.5) * (volatility * 0.5) +
          (jul.getFullYear() - 2005) * getTrend();

      if ([2008, 2009].includes(jul.getFullYear())) {
        if (socialClass === "lower") y *= 0.8 + Math.random() * 0.05;
        if (socialClass === "middle") y *= 0.85 + Math.random() * 0.05;
        if (socialClass === "high") y *= 0.9 + Math.random() * 0.05;
      }

      if (jul.getFullYear() === 2021) {
        if (socialClass === "lower") y *= 0.95 + Math.random() * 0.05;
        if (socialClass === "middle") y *= 0.95 + Math.random() * 0.1;
        if (socialClass === "high") y *= 1.1 + Math.random() * 0.1;
      }

      values.push({ x: jul.getTime(), y });
      date.setFullYear(date.getFullYear() + 1);
    }

    return { id, color, values, currency, socialClass };
  }

  // --- Családok definiálása ---
  const colors = d3.schemeCategory10;
  const families = [
    { id: "Smith", color: colors[0], base: 800, vol: 80, currency: "USD", socialClass: "lower" },
    { id: "Evans", color: colors[1], base: 2000, vol: 250, currency: "USD", socialClass: "middle" },
    { id: "Johnson", color: colors[2], base: 4000, vol: 500, currency: "USD", socialClass: "high" },
    { id: "Williams", color: colors[3], base: 1200, vol: 120, currency: "USD", socialClass: "lower" },
    { id: "Dower", color: colors[4], base: 2500, vol: 300, currency: "GBP", socialClass: "middle" },
    { id: "Blackwood", color: colors[5], base: 4500, vol: 500, currency: "GBP", socialClass: "high" },
    { id: "Brown", color: colors[6], base: 1500, vol: 180, currency: "GBP", socialClass: "lower" },
    { id: "Wilson", color: colors[7], base: 2000, vol: 220, currency: "EUR", socialClass: "middle" },
    { id: "Miller", color: colors[8], base: 4000, vol: 450, currency: "EUR", socialClass: "high" },
    { id: "Anderson", color: colors[9], base: 1000, vol: 120, currency: "EUR", socialClass: "lower" },
  ] as const;

  const sortedFamilies = [...families].sort((a, b) => a.id.localeCompare(b.id));
  const [data] = useState<LineSeries[]>(() =>
    sortedFamilies.map(f =>
      generateYearlyData(f.id, f.color, f.base, f.vol, f.currency, f.socialClass)
    )
  );

  // --- Állapotok ---
  const [selectedIds, setSelectedIds] = useState<string[]>(["Smith", "Blackwood", "Wilson"]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // --- Szűrt adatok csak kiválasztott családokra ---
  const filteredModalData = data.filter(series => selectedIds.includes(series.id));

  
  // --- Tooltip inicializálása csak egyszer ---
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);
  useEffect(() => {
    if (!tooltipRef.current) {
      tooltipRef.current = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "#fff")
        .style("padding", "5px 10px")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("font-size", "12px")
        .style("opacity", 0);
    }
  }, []);






  useEffect(() => {
    const tooltip = d3.select("body").append("div").attr("class", "tooltip")

    return () => {
      tooltip.remove(); // ✅ cleanup
    }
  }, [dateRange, filteredModalData, hoverWidth]);





  // --- D3 grafikon rajzolás ---
  useEffect(() => {
    if (!ref.current) return;

    // --- 1️⃣ Beállítások: méretek és margók ---
    const margin = { top: 60, right: 150, bottom: 30, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(ref.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    // Töröljük a korábbi elemeket újrarajzolás előtt
    svg.selectAll("*").remove();

    // Rajzterület létrehozása
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // --- 2️⃣ Szűrt adatok a jelenlegi dátumtartományra ---
    const filteredData = filteredModalData.map(series => ({
      ...series,
      values: series.values.filter(v => v.x >= dateRange[0] && v.x <= dateRange[1])
    }));

    // ClipPath a vonalak vágásához
    g.append("defs").append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", width)
      .attr("height", height);

    // --- 3️⃣ Skálák ---
    const x = d3.scaleTime()
      .domain([new Date(dateRange[0]), new Date(dateRange[1])])
      .range([0, width])

    
    // Y skála a legnagyobb USD-érték alapján
    const allYValues = filteredData.flatMap(series =>
      series.values.map(v => v.y * exchangeRates[series.currency as typeof currencies[number]])
    );
    const yMax = d3.max(allYValues) || 1;
    const yScale = d3.scaleLinear()
      .domain([0, yMax])
      .nice()
      .range([height, 0]);

    // --- 4️⃣ Tengelyek ---
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(6))
      .selectAll("text")
      .style("font-size", "14px")
      .style("font-family", "sans-serif");

    // Pénznemhez tartozó Y tengelyek, alapból rejtve
    currencies.forEach(curr => {
      const yAxisGroup = svg.append("g")
        .attr("class", `y-axis y-axis-${curr}`)
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .style("opacity", 0)
        .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => (Number(d)).toFixed(0)));

      yAxisGroup.append("text")
        .attr("class", `y-axis-currency currency-${curr}`)
        .attr("x", -10)
        .attr("y", -10)
        .attr("fill", "black")
        .attr("font-weight", "bold")
        .style("font-size", "14px")
        .style("opacity", 0)
        .text(curr);
    });

    // --- 5️⃣ Vonal generátor létrehozása minden sorozathoz ---
    const lineGenerators = filteredData.map(series =>
      d3.line<LineDataPoint>()
        .x(d => x(d.x))
        .y(d => yScale(d.y * exchangeRates[series.currency as typeof currencies[number]]))
    );

    // --- 6️⃣ Vonalcsoportok létrehozása és hover események ---
    const lines = g.selectAll(".line-group, .label-rect, .label-text, .data-point")
      .data(filteredData)
      .enter()
      .append("g")
      .attr("class", "line-group")
      .on("mouseenter", function (_, d) {
        if (hoveredId && hoveredId !== d.id) return;
          setHoveredId(d.id);

        d3.select(this).raise();

        d3.select(this).select(".line-hover-area")
          .style("pointer-events", hoveredId && hoveredId !== d.id ? "none" : "all")

        d3.selectAll(".line-path, .label-rect, .label-text, .label-line")
          .classed("inactive", true)
          .classed("active", false)

        d3.select(this).select(".line-path, .label-rect, .label-text")
          .classed("inactive", false)
          .classed("active", true)

        d3.select(this).selectAll(".data-point")
          .transition()
          .duration(200)
          .style("opacity", 1)

        d3.selectAll(`.label-rect.label-${d.id.replace(/\s+/g, '-')}`)
          .classed("inactive", false)
          .classed("active", true)

        d3.selectAll(`.label-text.label-${d.id.replace(/\s+/g, '-')}`)
          .classed("inactive", false)
          .classed("active", true)

        d3.selectAll(`.label-line.line-${d.id.replace(/\s+/g, '-')}`)
          .classed("inactive", false)
          .classed("active", true)

        d3.selectAll(`.y-axis.y-axis-${d.currency}`)
          .transition()
          .duration(200)
          .style("opacity", 1)

        d3.selectAll(`.currency-${d.currency}`)
          .transition()
          .duration(200)
          .style("opacity", 1)
      })
      .on("mouseleave", function (_, d) {
        if (hoveredId !== d.id) return;
          setHoveredId(null);

        d3.select(this).select(".line-hover-area")
          .style("pointer-events", "all");

        d3.selectAll(".line-path, .label-rect, .label-text")
          .classed("inactive", false)
          .classed("active", false)

        d3.selectAll(".label-line")
          .classed("inactive", true)

        d3.selectAll(".data-point")
          .transition()
          .duration(200)
          .style("opacity", 0)

        d3.selectAll(".y-axis")
          .transition()
          .duration(200)
          .style("opacity", 0)

        d3.selectAll(".y-axis-currency")
          .transition()
          .duration(200)
          .style("opacity", 0)
      })


    // --- 7️⃣ Láthatatlan hover terület ---
    lines.append("path")
      .attr("class", "line-hover-area")
      .attr("fill", "none")
      .attr("stroke", "transparent")
      .attr("stroke-width", hoverWidth)
      .attr("d", (d,i) => lineGenerators[i](d.values) ?? "")

    // --- 8️⃣ Látható vonalak ---
    lines.append("path")
      .attr("class", "line-path")
      .attr("clip-path", "url(#clip)")
      .attr("fill", "none")
      .attr("stroke", d => d.color)
      .attr("stroke-width", 2)
      .attr("d", (d,i) => lineGenerators[i](d.values) ?? "")

    // --- 9️⃣ Adatpontok kirajzolása és tooltip események ---
    lines.selectAll(".data-point")
      .data((d, i) => d.values
                        .filter(v => v.x >= dateRange[0] && v.x <= dateRange[1])
                        .map(v => ({ ...v, color: d.color, parentId: d.id, lineIndex: i, currency: d.currency })))
      .enter()
      .append("circle")
      .attr("class", d => `data-point point-${d.parentId.replace(/\s+/g, '-')}`)
      .attr("cx", d => x(d.x))
      .attr("cy", d => yScale(d.y * exchangeRates[d.currency as typeof currencies[number]]))
      .attr("r", 4)
      .attr("fill", d => d.color)
      .style("opacity", 0)
      .on("mouseover", function (event, d) {
        const yInUSD = d.y * exchangeRates[d.currency as typeof currencies[number]];
        const tooltip = tooltipRef.current!;
        tooltip
          .style("opacity", 1)
          .html(`
            <div class='text-center'>
              <span class='text-base'>
              ${yInUSD.toFixed(1)} ${d.currency}
              </span><br />
              <span class='text-sm'>
                ${formatDateUS(new Date(d.x))}
              </span>
            </div>
          `)
      })
      .on("mousemove", function (event) {
        const tooltip = tooltipRef.current!;

        tooltip
          .style("left", (event.pageX - 75 / 2) + "px")
          .style("top", (event.pageY + 20) + "px")
      })
      .on("mouseleave", function () {
        const tooltip = tooltipRef.current!;

        tooltip
          .style("opacity", 0)
      })

    // --- 1️⃣0️⃣ Címkék rajzolása a vonalak végére ---
    function getContrastColor(hexColor: string): string {
      hexColor = hexColor.replace("#", "")
      const r = parseInt(hexColor.substring(0, 2), 16)
      const g = parseInt(hexColor.substring(2, 4), 16)
      const b = parseInt(hexColor.substring(4, 6), 16)
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b
      return luminance > 186 ? "black" : "white"
    }

    const labelSpacing = 30
    const labelStartX = width + 20
    lines.each(function (line, i) {
      if (!line.values.length) return;

      console.log(line)

      const group = d3.select(this)
      const lastPoint = line.values[line.values.length - 1]
      const labelText = line.id + " (" + line.currency + ")"
      const fillColor = line.color
      const textColor = getContrastColor(fillColor)

      // Ideiglenes text elem a szélesség méréséhez
      const tempText = group.append("text")
        .attr("font-size", "15px")
        .attr("font-weight", "bold")
        .text(labelText)
        .attr("visibility", "hidden")

      const bbox = tempText.node()?.getBBox()
      if (!bbox) return

      const labelY = i * labelSpacing

      // Összekötő vonal a grafikon utolsó pontjától a címkéig
      g.append("line")
        .attr("class", `label-line line-${line.id.replace(/\s+/g, '-')}`)
        .attr("x1", x(lastPoint.x))
        .attr("y1", yScale(lastPoint.y * exchangeRates[line.currency as typeof currencies[number]]))
        .attr("x2", labelStartX)
        .attr("y2", labelY)
        .attr("stroke", fillColor)
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3 3")

      // Háttér téglalap
      group.append("rect")
        .attr("class", `label-rect label-${line.id.replace(/\s+/g, '-')}`)
        .attr("x", labelStartX)
        .attr("y", labelY - (bbox.height+5) / 2)
        .attr("width", bbox.width + 5)
        .attr("height", bbox.height + 5)
        .attr("fill", fillColor)
        .attr("rx", 3)
        .attr("ry", 3)

      // Szöveg
      group.append("text")
        .attr("class", `label-text label-${line.id.replace(/\s+/g, '-')}`)
        .attr("x", labelStartX + 5)
        .attr("y", labelY)
        .attr("fill", textColor)
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("alignment-baseline", "middle")
        .text(labelText)

      tempText.remove()
    })

    // --- 1️⃣1️⃣ Grafikon cím ---
    svg.append("foreignObject")
      .attr("x", margin.left)
      .attr("y", -40)
      .attr("width", width)
      .attr("height", 50)
      .append("xhtml:div")
      .style("width", "100%")
      .style("text-align", "center")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .text("Household budgets since 2005")
      .style("z-index", "100")


    // --- 1️⃣2️⃣ Marker események (válság, Covid) ---
  const markers = [
    { xVal: new Date(2008, 9, 11), label: "Financial crisis", img: Valsag, widthI: 40, heightI: 40 },
    { xVal: new Date(2021, 2, 21), label: "Covid", img: Covid, widthI: 36, heightI: 36 },
  ];

    markers.forEach(({ xVal, label, img, widthI, heightI }) => {
      if (xVal.getTime() < dateRange[0] || xVal.getTime() > dateRange[1]) return

      const markerX = x(xVal)

      // Függőleges szaggatott vonal
      g.append("line")
        .attr("x1", markerX)
        .attr("x2", markerX)
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "gray")
        .attr("stroke-dasharray", "4 4")

      // Kép és szöveg HTML-ként, foreignObject segítségével
      const fo = svg.append("foreignObject")
        .attr("x", markerX + margin.left - 45)
        .attr("y", - 5)
        .attr("width", 90)
        .attr("height", 90)

      const div = fo.append("xhtml:div")
        .attr("class", "marker-div")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("pointer-events", "none")
        .style("text-align", "center")

      div.append("img")
        .attr("src", img)
        .attr("width", widthI)
        .attr("height", heightI)
        .style("border-radius", "50%")

      div.append("span")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text(label)
    })
  }, [dateRange, filteredModalData, hoverWidth, hoveredId]) // useEffect csak egyszer fusson

  // --- JSX visszatérés ---
  return (
    <div>
      <TrendsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={data}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      <div className="flex flex-wrap justify-between">
        <div>
          <button
            className="py-[7px] px-[24px] text-base bg-gray-300 cursor-pointer border border-gray-200 flex flex-wrap items-center"
            onClick={() => setIsModalOpen(true)}
          >
            Trends
            <span className="ml-2 h-5 w-5 rounded-full bg-[#7252BC] text-white text-sm flex items-center justify-center">
              {selectedIds.length}
            </span>
          </button>
        </div>

        <div>
          <button
            className={`py-[7px] px-[24px] text-base bg-gray-300 cursor-pointer border border-gray-200 ${rangeVisible ? "" : "active-btn"}`}
            onClick={() => Last6Month()}
          >
            Last 6 month
          </button>
          <button
            className={`py-[7px] px-[24px] text-base bg-gray-300 cursor-pointer border border-gray-200 ${rangeVisible ? "active-btn" : ""}`}
            onClick={() => setRangeVisible(true)}
          >
            Date range
          </button>
        </div>
      </div>

      {rangeVisible && (
        <div className="mx-12 mb-5 mt-5">
          <Slider
            value={dateRange}
            min={dateToTimestamp(startDate)}
            max={dateToTimestamp(endDate)}
            onChange={handleChange}
            valueLabelDisplay="auto"
            valueLabelFormat={timestampToDateString}
            step={24 * 3600 * 1000}
            sx={{ color: '#7252BC' }}
          />
        </div>
      )}

      <svg className="mt-12" ref={ref}></svg>
    </div>
  )
}

export default MultiLineChart
