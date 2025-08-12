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
interface LineSeries {
  id: string           // vonal neve (pl. "Family A")
  values: LineDataPoint[] // a vonalhoz tartozó pontok
  color: string        // a vonal színe
}

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

  const startDate = new Date(2020, 0, 1);
  const endDate = new Date(2020, 0, 29);
  const [dateRange, setDateRange] = React.useState<[number, number]>([
    dateToTimestamp(startDate),
    dateToTimestamp(endDate),
  ])
  
  // 4️⃣ Adatok generálása (3 különböző "család" vonal)
  const data: LineSeries[] = [
    {
      id: "Family A",
      color: "steelblue",
      values: d3.range(30).map((i) => {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        let y = 100 + i * 20 + Math.random() * 30
        if (i >= 10) y -= 30
        if (i >= 20) y -= 20
        return { x: date.getTime(), y }
      }),
    },
    {
      id: "Family B",
      color: "tomato",
      values: d3.range(30).map((x) => {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + x)
        let y = 80 + x * 10 + Math.random() * 10
        if (x >= 10) y -= 15
        if (x >= 20) y -= 40
        return { x: date.getTime(), y }
      }),
    },
    {
      id: "Family C",
      color: "green",
      values: d3.range(30).map((x) => {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + x)
        let y = 10 + x * 5 + Math.random() * 5
        if (x >= 10) y -= 20
        if (x >= 20) y -= 10
        return { x: date.getTime(), y }
      }),
    },
  ]

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(data.map((d) => d.id));

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
      .call(d3.axisBottom(x))

    // Több y skála létrehozása
    const yScales = filteredData.map((series, i) => {
      const yScale = d3.scaleLinear()
        .domain([0, d3.max(series.values.map(v => v.y)) || 1])
        .nice()
        .range([height, 0])
      return yScale
    })

    // Y tengelyek csoportja
    const yAxisGroups = filteredData.map((series, i) => {
      return svg.append("g")
        .attr("class", `y-axis y-axis-${series.id.replace(/\s+/g, '-')}`)
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .style("opacity", 0)
        .call(d3.axisLeft(yScales[i]))
    })

    // 7️⃣ Vonal generátor (pontokat összekötő függvény)
    const lineGenerators = filteredData.map((series, i) => {
      return d3.line<LineDataPoint>()
        .x(d => x(d.x))
        .y(d => yScales[i](d.y))
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

        d3.selectAll(`.y-axis.y-axis-${d.id.replace(/\s+/g, '-')}`)
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
      })

    // 9️⃣ Láthatatlan hover terület a könnyebb egérkezeléshez
    lines.append("path")
      .attr("class", "line-hover-area")
      .attr("fill", "none")
      .attr("stroke", "transparent")
      .attr("stroke-width", 15)
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
      .data((d, i) => d.values.map(v => ({ ...v, color: d.color, parentId: d.id, lineIndex: i })))
      .enter()
      .append("circle")
      .attr("class", d => `data-point point-${d.parentId.replace(/\s+/g, '-')}`)
      .attr("cx", d => x(d.x))
      .attr("cy", d => yScales[d.lineIndex](d.y))
      .attr("r", 4)
      .attr("fill", d => d.color)
      .style("opacity", 0)
      .on("mouseover", function (event, d) {
        tooltip
          .style("opacity", 1)
          .html(`
            <strong>${d.parentId}</strong><br/>
            Év: ${new Date(d.x).toISOString().slice(0, 10).replace(/-/g, '.')}<br/>
            Érték: ${d.y.toFixed(1)}
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
    const labelSpacing = 25 // px távolság a címkék között
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
        .attr("font-size", "12px")
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
        .attr("y1", yScales[i](lastPoint.y))
        .attr("x2", labelStartX)
        .attr("y2", labelY)
        .attr("stroke", fillColor)
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3 3")

      // Háttér téglalap
      group.append("rect")
        .attr("class", `label-rect label-${line.id.replace(/\s+/g, '-')}`)
        .attr("x", labelStartX)
        .attr("y", labelY - bbox.height / 2)
        .attr("width", bbox.width + 10)
        .attr("height", bbox.height)
        .attr("fill", fillColor)
        .attr("rx", 3)
        .attr("ry", 3)

      // Szöveg
      group.append("text")
        .attr("class", `label-text label-${line.id.replace(/\s+/g, '-')}`)
        .attr("x", labelStartX + 5)
        .attr("y", labelY)
        .attr("fill", textColor)
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("alignment-baseline", "middle")
        .text(labelText)

      tempText.remove()
    })

    // 1️⃣4️⃣ Marker események (pl. válság, Covid)
    const markers = [
      { xVal: new Date(2020, 0, 11), label: "Financial crisis", img: Valsag },
      { xVal: new Date(2020, 0, 21), label: "Covid", img: Covid },
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

  }, [dateRange, filteredModalData]) // useEffect csak egyszer fusson

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

      <div className="flex flex-wrap justify-between">
        <div>
          <button className="py-[7px] px-[24px] text-base bg-gray-300 cursor-pointer border border-gray-200" onClick={() => setIsModalOpen(true)}>
            Trends
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
            />
          </div>
        )
      }


      <svg className="mt-12" ref={ref}></svg>
    </div>
  )
}

export default MultiLineChart