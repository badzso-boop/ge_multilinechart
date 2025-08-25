import * as d3 from "d3"
import Slider from '@mui/material/Slider';
import TrendsModal from "./TrendsModal";
import React, { useRef, useEffect, useState } from "react"

// Képek importálása marker ikonokhoz
import Covid from "../images/covid.png"
import Valsag from "../images/valsag.png"

// Egyetlen adatpont típusa
interface LineDataPoint {
  x: number // X koordináta (pl. év, hónap index)
  y: number // Y érték (pl. pénz, darabszám)
}

// Egy teljes vonal adatsor típusa
export interface LineSeries {
  id: string           // vonal neve (pl. "Family A")
  values: LineDataPoint[] // a vonalhoz tartozó pontok
  color: string        // a vonal színe
  currency: string
}

type SocialClass = "lower" | "middle" | "high";

const MultiLineChart: React.FC = () => {
  // React ref, hogy az SVG DOM elemhez hozzáférjünk
  const ref = useRef<SVGSVGElement | null>(null)

  function dateToTimestamp(date: Date) {
    return date.getTime();
  }

  function timestampToDateString(timestamp: number) {
    const d = new Date(timestamp);
    return d.toISOString().slice(0, 10); // YYYY-MM-DD formátum
  }

  function Last6Month() {
    setRangeVIsible(false);

    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    setDateRange([
      dateToTimestamp(sixMonthsAgo),
      dateToTimestamp(today),
    ]);
  }

  function formatDateUS(date: Date) {
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${month} ${day}, ${year}`
  }

  const startDate = new Date(2005, 0, 1) // 2005 január
  const endDate = new Date(2025, 8, 31) // 2023 december
  const [dateRange, setDateRange] = React.useState<[number, number]>([
    dateToTimestamp(startDate),
    dateToTimestamp(endDate),
  ])
  const [hoverWidth, setHoverWidth] = useState(15);
  const currencies = ["USD", "EUR", "GBP"] as const;
  const exchangeRates: Record<typeof currencies[number], number> = {
    USD: 1,      // USD alap
    EUR: 1.17,    // 1 EUR = 1.1 USD
    GBP: 1.35,    // 1 GBP = 1.3 USD
  };

  // 🔥 Új adatgenerátor: évente max 2 pont (jan, júl)
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

    while (date <= endDate) {
      // 🔹 segéd függvény a trendhez
      const getTrend = () => {
        if (socialClass === "lower") return 20 + Math.random() * 30;
        if (socialClass === "middle") return 50 + Math.random() * 100;
        if (socialClass === "high") return 100 + Math.random() * 100;
        return 0;
      };

      // Január
      const jan = new Date(date);
      let y = base + (Math.random() - 0.5) * (volatility * 0.5) + (jan.getFullYear() - 2005) * getTrend();

      // Válság 2008-2009
      if (jan.getFullYear() === 2008 || jan.getFullYear() === 2009) {
        if (socialClass === "lower") y *= 0.8 + Math.random() * 0.05;
        if (socialClass === "middle") y *= 0.85 + Math.random() * 0.05;
        if (socialClass === "high") y *= 0.9 + Math.random() * 0.05;
      }

      // COVID 2021
      if (jan.getFullYear() === 2021) {
        if (socialClass === "lower") y *= 0.95 + Math.random() * 0.05;
        if (socialClass === "middle") y *= 0.95 + Math.random() * 0.1;
        if (socialClass === "high") y *= 1.1 + Math.random() * 0.1;
      }

      values.push({ x: jan.getTime(), y });

      // Július
      const jul = new Date(date);
      jul.setMonth(6);
      y = base + (Math.random() - 0.5) * (volatility * 0.5) + (jul.getFullYear() - 2005) * getTrend();

      if (jul.getFullYear() === 2008 || jul.getFullYear() === 2009) {
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

    return { id, color, values, currency };
  }


  const colors = d3.schemeCategory10;
  // 🎨 Családok definiálása
  const families = [
    // 🇺🇸 Amerikai családok
    { id: "Smith", color: colors[0], base: 800, vol: 80, currency: "USD", socialClass: "lower" },
    { id: "Evans", color: colors[1], base: 2000, vol: 250, currency: "USD", socialClass: "middle" },
    { id: "Johnson", color: colors[2], base: 4000, vol: 500, currency: "USD", socialClass: "high" },
    { id: "Williams", color: colors[3], base: 1200, vol: 120, currency: "USD", socialClass: "lower" },

    // 🇬🇧 Brit családok
    { id: "Dower", color: colors[4], base: 2500, vol: 300, currency: "GBP", socialClass: "middle" },
    { id: "Blackwood", color: colors[5], base: 4500, vol: 500, currency: "GBP", socialClass: "high" },
    { id: "Brown", color: colors[6], base: 1500, vol: 180, currency: "GBP", socialClass: "lower" },

    // 🇩🇪 Német családok
    { id: "Wilson", color: colors[7], base: 2000, vol: 220, currency: "EUR", socialClass: "middle" },
    { id: "Miller", color: colors[8], base: 4000, vol: 450, currency: "EUR", socialClass: "high" },
    { id: "Anderson", color: colors[9], base: 1000, vol: 120, currency: "EUR", socialClass: "lower" },
  ] as const;


  const [data] = useState<LineSeries[]>(() =>
    families.map(f =>
      generateYearlyData(f.id, f.color, f.base, f.vol, f.currency, f.socialClass)
    )
  );

  // 🔥 Kezdetben csak 1-1 család látszik minden classból
  const [selectedIds, setSelectedIds] = useState<string[]>(["Smith", "Blackwood", "Wilson"]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredModalData = data.filter((series) =>
    selectedIds.includes(series.id)
  );

  const handleChange = (event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      setDateRange(newValue as [number, number]);
    }
  };

  const [rangeVisible, setRangeVIsible] = useState(true);

  // A D3 rajzolás csak a komponens betöltése után fusson le
  useEffect(() => {

    // 1️⃣ Margók és rajzterület beállítása
    const margin = { top: 60, right: 30, bottom: 30, left: 50 }
    const width = 800 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

    // 2️⃣ SVG elem kiválasztása és méretezése
    const svg = d3.select(ref.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)

    // Minden korábbi tartalom törlése (újrarenderelésnél fontos)
    svg.selectAll("*").remove()

    // 3️⃣ Rajzterület csoport létrehozása, margókkal eltolva
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    const filteredData = filteredModalData.map(series => ({
      ...series,
      values: series.values.filter(v => v.x >= dateRange[0] && v.x <= dateRange[1])
    }))

    // 5️⃣ Skálák létrehozása
    const x = d3.scaleTime()
      .domain([new Date(dateRange[0]), new Date(dateRange[1])])
      .range([0, width])

    // 6️⃣ Tengelyek rajzolása
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(6))
      .selectAll("text")
      .style("font-size", "14px")
      .style("font-family", "sans-serif");

    const allValuesInUSD = data.flatMap(series =>
      series.values.map(v => v.y * exchangeRates[series.currency as typeof currencies[number]])
    );

    const globalMax = d3.max(allValuesInUSD) || 1;

    const yScale = d3.scaleLinear()
      .domain([0, globalMax])
      .nice()
      .range([height, 0]);

    currencies.forEach(curr => {
      const group = svg.append("g")
        .attr("class", `y-axis y-axis-${curr}`)
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .style("opacity", 0) // ✅ alapból elrejtjük

      // Tengely számokkal
      group.call(
        d3.axisLeft(yScale)
          .ticks(5)
          .tickFormat(d => (Number(d) / exchangeRates[curr as typeof currencies[number]]).toFixed(0))
      );

      // Valuta címke külön szövegként, a tengely tetejére
      group.append("text")
        .attr("class", `y-axis-currency currency-${curr}`)
        .attr("x", -10)     // a tengely bal oldalán kívülre
        .attr("y", -10)     // a tengely tetejére
        .attr("fill", "black")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .style("opacity", 0) // ✅ alapból elrejtve
        .text(curr);
    });

    const lineGenerators = filteredData.map((series, i) => {
      return d3.line<LineDataPoint>()
        .x(d => x(d.x))
        .y(d => yScale(d.y * exchangeRates[series.currency as typeof currencies[number]]))
    })

    // 8️⃣ Vonalcsoportok létrehozása + hover események
    const lines = g.selectAll(".line-group, .label-rect, .label-text, .data-point")
      .data(filteredData)
      .enter()
      .append("g")
      .attr("class", "line-group")
      .on("mouseenter", function (_, d) {
        // Minden vonal elhalványítása
        d3.selectAll(".line-path, .label-rect, .label-text, .label-line")
          .classed("inactive", true)
          .classed("active", false)

        // Aktuális vonal és címke kiemelése
        d3.select(this).select(".line-path, .label-rect, .label-text")
          .classed("inactive", false)
          .classed("active", true)

        // Adatpontok megjelenítése
        d3.select(this).selectAll(".data-point")
          .transition()
          .duration(200)
          .style("opacity", 1)

        // Kapcsolódó címkék kiemelése
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
      .on("mouseleave", function () {
        // Minden visszaáll alapállapotba
        d3.selectAll(".line-path, .label-rect, .label-text")
          .classed("inactive", false)
          .classed("active", false)

        d3.selectAll(".data-point")
          .transition()
          .duration(200)
          .style("opacity", 0)

        // Tengely elrejtése
        d3.selectAll(".y-axis")
          .transition()
          .duration(200)
          .style("opacity", 0)

        d3.selectAll(".y-axis-currency")
          .transition()
          .duration(200)
          .style("opacity", 0)
      })

    // 9️⃣ Láthatatlan hover terület a könnyebb egérkezeléshez
    lines.append("path")
      .attr("class", "line-hover-area")
      .attr("fill", "none")
      .attr("stroke", "transparent")
      .attr("stroke-width", hoverWidth)
      .attr("d", (d,i) => lineGenerators[i](d.values) ?? "")

    // 🔟 Látható vonal kirajzolása
    lines.append("path")
      .attr("class", "line-path")
      .attr("fill", "none")
      .attr("stroke", d => d.color)
      .attr("stroke-width", 4)
      .attr("d", (d,i) => lineGenerators[i](d.values) ?? "")

    // 1️⃣1️⃣ Adatpontok kirajzolása + tooltip események
    lines.selectAll(".data-point")
      .data((d, i) => d.values.map(v => ({ ...v, color: d.color, parentId: d.id, lineIndex: i, currency: d.currency })))
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
        console.log(d.y)
        console.log(d.currency)
        console.log(exchangeRates[d.currency as typeof currencies[number]])
        console.log(yInUSD)

        tooltip
          .style("opacity", 1)
          .html(`
            <div>
              <span>
               ${d.y.toFixed(1)} USD (~${yInUSD.toFixed(1)} ${d.currency})
              </span><br />
              ${formatDateUS(new Date(d.x))}
            </div>
          `)
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", (event.pageX - 75 / 2) + "px")
          .style("top", (event.pageY + 20) + "px")
      })
      .on("mouseout", function () {
        tooltip
          .style("opacity", 0)
      })

    // 1️⃣2️⃣ Szöveg színének automatikus választása háttér alapján
    function getContrastColor(hexColor: string): string {
      hexColor = hexColor.replace("#", "")
      const r = parseInt(hexColor.substring(0, 2), 16)
      const g = parseInt(hexColor.substring(2, 4), 16)
      const b = parseInt(hexColor.substring(4, 6), 16)
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b
      return luminance > 186 ? "black" : "white"
    }

    // 1️⃣3️⃣ Címkék rajzolása a vonalak végére
    const labelSpacing = 30 // px távolság a címkék között
    const labelStartX = width + 20 // címke kezdő X pozíció

    lines.each(function (line, i) {
      if (!line.values.length) return;

      const group = d3.select(this)
      const lastPoint = line.values[line.values.length - 1]
      const labelText = line.id
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
        .attr("width", bbox.width + 15)
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

    // 1️⃣4️⃣ Marker események (pl. válság, Covid)
    const markers = [
      { xVal: new Date(2008, 9, 11), label: "Financial crisis", img: Valsag },
      { xVal: new Date(2021, 2, 21), label: "Covid", img: Covid },
    ]

    markers.forEach(({ xVal, label, img }) => {
      if (xVal.getTime() < dateRange[0] || xVal.getTime() > dateRange[1]) return // ne rajzold ki ha kívül van a tartományon

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
        .attr("x", markerX + margin.left - 40)
        .attr("y", - 20)
        .attr("width", 80)
        .attr("height", 80)

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
        .attr("width", 40)
        .attr("height", 40)
        .style("border-radius", "50%")

      div.append("span")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text(label)
    })

    // 1️⃣5️⃣ Tooltip div létrehozása (HTML, nem SVG)
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "#fff")
      .style("padding", "5px 10px")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("font-size", "12px")
      .style("opacity", 0)

  }, [dateRange, filteredModalData, hoverWidth]) // useEffect csak egyszer fusson

  // Visszatérés: üres SVG, amit a D3 tölt fel
  return (
    <div>
      <TrendsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={data}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      <div className="mx-12 mb-5 mt-5">
        <label className="block mb-2 font-semibold">Hover area width: {hoverWidth}px</label>
        <Slider
          value={hoverWidth}
          min={1}
          max={50}
          step={1}
          onChange={(e, val) => setHoverWidth(val as number)}
          sx={{ color: '#52bc72' }}
        />
      </div>

      <div className="flex flex-wrap justify-between">
        <div>
          <button className="py-[7px] px-[24px] text-base bg-gray-300 cursor-pointer border border-gray-200 flex flex-wrap items-center" onClick={() => setIsModalOpen(true)}>
            Trends 
            <span className="ml-2 h-5 w-5 rounded-full bg-[#7252BC] text-white text-sm flex items-center justify-center">
              {selectedIds.length}
            </span>
          </button>
        </div>

        <div>
          <button className={`py-[7px] px-[24px] text-base bg-gray-300 cursor-pointer border border-gray-200 ${rangeVisible ? "" : "active-btn"}`} onClick={() => Last6Month()}>
            Last 6 month
          </button>
          <button className={`py-[7px] px-[24px] text-base bg-gray-300 cursor-pointer border border-gray-200 ${rangeVisible ? "active-btn" : ""}`} onClick={() => setRangeVIsible(true)}>
            Date range
          </button>
        </div>
      </div>


      {
        rangeVisible && (
          <div className="mx-12 mb-5 mt-5">
            <Slider
              value={dateRange}
              min={dateToTimestamp(startDate)}
              max={dateToTimestamp(endDate)}
              onChange={handleChange}
              valueLabelDisplay="auto"
              valueLabelFormat={timestampToDateString}
              step={24 * 3600 * 1000} // 1 nap lépésköz
              sx={{
                color: '#7252BC'
              }}
            />
          </div>
        )
      }


      <svg className="mt-12" ref={ref}></svg>
    </div>
  )
}

export default MultiLineChart