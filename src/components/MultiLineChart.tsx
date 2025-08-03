import * as d3 from "d3"
import React, { useRef, useEffect } from "react"

import Covid from "../images/covid.png"
import Valsag from "../images/valsag.png"

interface LineDataPoint {
  x: number
  y: number
}

interface LineSeries {
  id: string
  values: LineDataPoint[]
  color: string
}

const MultiLineChart: React.FC = () => {
  const ref = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const margin = { top: 60, right: 30, bottom: 30, left: 50 }
    const width = 800 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

    const svg = d3.select(ref.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)

    svg.selectAll("*").remove()

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // 3 vonal adat
    const data: LineSeries[] = [
      {
        id: "Család A",
        color: "steelblue",
        values: d3.range(30).map((x) => {
          let y = 100 + x * 8 + Math.random() * 10 // alapnövekedés
          if (x >= 10) y -= 30                     // válság hatás
          if (x >= 20) y -= 20                     // covid hatás
          return { x, y }
        }),
      },
      {
        id: "Család B",
        color: "tomato",
        values: d3.range(30).map((x) => {
          let y = 80 + x * 5 + Math.random() * 15
          if (x >= 10) y -= 15
          if (x >= 20) y -= 40 // covid jobban érinti
          return { x, y }
        }),
      },
      {
        id: "Család C",
        color: "green",
        values: d3.range(30).map((x) => {
          let y = 60 + x * 4 + Math.random() * 8
          if (x >= 10) y -= 20
          if (x >= 20) y -= 10
          return { x, y }
        }),
      },
    ]

    // Skálák
    const x = d3.scaleLinear()
      .domain([0, 29])
      .range([0, width])

    const y = d3.scaleLinear()
      .domain([0, d3.max(data.flatMap(d => d.values.map(v => v.y))) || 1])
      .nice()
      .range([height, 0])

    // Tengelyek
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))

    g.append("g")
      .call(d3.axisLeft(y))

    // Vonal generátor
    const line = d3.line<LineDataPoint>()
      .x(d => x(d.x))
      .y(d => y(d.y))

    // Vonalak renderelése
    const lines = g.selectAll(".line-group, .label-rect, .label-text")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "line-group")
      .on("mouseenter", function (_, d) {
        // minden vonal és label elhalványul
        d3.selectAll(".line-path, .label-rect, .label-text")
          .classed("inactive", true)
          .classed("active", false)

        // az adott vonal és label kiemelése
        d3.select(this).select(".line-path, .label-rect, .label-text")
          .classed("inactive", false)
          .classed("active", true)

        // a hozzá tartozó label-ek kijelölése id alapján
        d3.selectAll(`.label-rect.label-${d.id.replace(/\s+/g, '-')}`)
          .classed("inactive", false)
          .classed("active", true)

        d3.selectAll(`.label-text.label-${d.id.replace(/\s+/g, '-')}`)
          .classed("inactive", false)
          .classed("active", true)
      })
      .on("mouseleave", function () {
        d3.selectAll(".line-path, .label-rect, .label-text")
          .classed("inactive", false)
          .classed("active", false)
      })

    lines.append("path")
      .attr("class", "line-path")
      .attr("fill", "none")
      .attr("stroke", d => d.color)
      .attr("stroke-width", 2)
      .attr("d", d => line(d.values) ?? "")

    function getContrastColor(hexColor: string): string {
      // Egyszerű kontraszt számítás: ha világos a háttér → fekete szöveg, ha sötét → fehér szöveg
      hexColor = hexColor.replace("#", "")
      const r = parseInt(hexColor.substring(0, 2), 16)
      const g = parseInt(hexColor.substring(2, 4), 16)
      const b = parseInt(hexColor.substring(4, 6), 16)
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b
      return luminance > 186 ? "black" : "white"
    }

    // label-ek rajzolása
    data.forEach((line) => {
      const lastPoint = line.values[line.values.length - 1]
      const labelText = line.id
      const fillColor = line.color
      const textColor = getContrastColor(fillColor)

      // Ideiglenes text elem a méret méréséhez (láthatatlanul)
      const tempText = g.append("text")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(labelText)
        .attr("visibility", "hidden")

      const bbox = tempText.node()?.getBBox()
      if (!bbox) return

      // Háttér téglalap
      g.append("rect")
        .attr("class", `label-rect label-${line.id.replace(/\s+/g, '-')}`)
        .attr("x", x(lastPoint.x))
        .attr("y", y(lastPoint.y) - bbox.height / 2)
        .attr("width", bbox.width + 10)  // kis padding
        .attr("height", bbox.height)
        .attr("fill", fillColor)
        .attr("rx", 3) // lekerekített sarkok
        .attr("ry", 3)

      // Szöveg a téglalap tetején
      g.append("text")
        .attr("class", `label-text label-${line.id.replace(/\s+/g, '-')}`)
        .attr("x", x(lastPoint.x) + 5)  // paddingbalra 5, így középre kerül a text
        .attr("y", y(lastPoint.y))
        .attr("fill", textColor)
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("alignment-baseline", "middle")
        .text(labelText)

      // Ideiglenes eltávolítása
      tempText.remove()
    })

    // Marker vonalak és custom div hely
    const markers = [
      { xVal: 10, label: "Válság", img: Valsag },
      { xVal: 20, label: "Covid", img: Covid },
    ]

    markers.forEach(({ xVal, label, img }) => {
      const markerX = x(xVal)

      // Vonal
      g.append("line")
        .attr("x1", markerX)
        .attr("x2", markerX)
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "gray")
        .attr("stroke-dasharray", "4 4")

      // Egyedi HTML elem foreignObject-en belül
      const fo = svg.append("foreignObject")
        .attr("x", markerX + margin.left - 35)
        .attr("y", -10) // kicsit a grafikon fölé helyezve
        .attr("width", 80)
        .attr("height", 80)

      const div = fo.append("xhtml:div")
        .attr("class", "marker-div")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("pointer-events", "none")

      div.append("img")
        .attr("src", img)
        .attr("margin-top", "50px")
        .attr("width", 40)
        .attr("height", 40)
        .style("border-radius", "50%") // ha kör alakú kell

      div.append("span")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text(label)
    })

  }, [])

  return <svg ref={ref}></svg>
}

export default MultiLineChart
