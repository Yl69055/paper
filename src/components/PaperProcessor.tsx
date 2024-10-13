'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export function PaperProcessor() {
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const [results, setResults] = useState<string[]>([])
  const leftColumnRef = useRef<HTMLDivElement>(null)
  const rightColumnRef = useRef<HTMLDivElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        const lines = content.split('\n')
        const newParagraphs: string[] = []
        let currentParagraph = ''
        let isHeaderSection = false
        let isTableSection = false

        lines.forEach((line, index) => {
          if (line.startsWith('|') || line.trim().startsWith('|')) {
            if (!isTableSection && currentParagraph) {
              newParagraphs.push(currentParagraph.trim())
              currentParagraph = ''
            }
            isTableSection = true
            currentParagraph += (currentParagraph ? '\n' : '') + line
          } else if (line.startsWith('#')) {
            if (currentParagraph && !isHeaderSection) {
              newParagraphs.push(currentParagraph.trim())
              currentParagraph = ''
            }
            isHeaderSection = true
            isTableSection = false
            currentParagraph += (currentParagraph ? '\n' : '') + line
          } else if (line.trim() === '') {
            if (currentParagraph) {
              newParagraphs.push(currentParagraph.trim())
              currentParagraph = ''
              isHeaderSection = false
              isTableSection = false
            }
          } else {
            if (!isHeaderSection && !isTableSection && currentParagraph) {
              newParagraphs.push(currentParagraph.trim())
              currentParagraph = ''
            }
            isTableSection = false
            currentParagraph += (currentParagraph ? '\n' : '') + line
          }

          if (index === lines.length - 1 && currentParagraph) {
            newParagraphs.push(currentParagraph.trim())
          }
        })

        setParagraphs(newParagraphs)
        setResults(new Array(newParagraphs.length).fill(''))
      }
      reader.readAsText(file)
    }
  }

  const processText = (text: string, operation: string, index: number) => {
    const newResults = [...results]
    newResults[index] = `${operation}: ${text}`
    setResults(newResults)
  }

  const formatMarkdown = (text: string) => {
    const lines = text.split('\n')
    const formattedLines = []
    let isTable = false
    let tableContent = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.startsWith('|')) {
        if (!isTable) {
          isTable = true
          tableContent = []
        }
        tableContent.push(line)
      } else {
        if (isTable) {
          formattedLines.push(renderTable(tableContent))
          isTable = false
          tableContent = []
        }
        if (line.startsWith('###')) {
          formattedLines.push(<h3 key={i} className="text-lg font-bold mt-2 mb-1">{line.replace(/^###\s*/, '')}</h3>)
        } else if (line.startsWith('##')) {
          formattedLines.push(<h2 key={i} className="text-xl font-bold mt-3 mb-2">{line.replace(/^##\s*/, '')}</h2>)
        } else if (line.startsWith('#')) {
          formattedLines.push(<h1 key={i} className="text-2xl font-bold mt-4 mb-3">{line.replace(/^#\s*/, '')}</h1>)
        } else {
          formattedLines.push(<p key={i} className="mb-1">{line}</p>)
        }
      }
    }

    if (isTable) {
      formattedLines.push(renderTable(tableContent))
    }

    return formattedLines
  }

  const renderTable = (tableContent: string[]) => {
    const rows = tableContent.map(row => 
      row.split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim())
    )
    const headers = rows[0]
    const alignments = rows[1].map(cell => {
      if (cell.startsWith(':') && cell.endsWith(':')) return 'center'
      if (cell.endsWith(':')) return 'right'
      return 'left'
    })
    const bodyRows = rows.slice(2)

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th 
                  key={index}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{textAlign: alignments[index]}}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bodyRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td 
                    key={cellIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    style={{textAlign: alignments[cellIndex]}}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  useEffect(() => {
    const adjustHeights = () => {
      if (leftColumnRef.current && rightColumnRef.current) {
        const leftItems = leftColumnRef.current.children
        const rightItems = rightColumnRef.current.children
        for (let i = 0; i < leftItems.length; i++) {
          const leftItem = leftItems[i] as HTMLElement
          const rightItem = rightItems[i] as HTMLElement
          if (leftItem && rightItem) {
            const maxHeight = Math.max(leftItem.offsetHeight, rightItem.offsetHeight)
            leftItem.style.height = `${maxHeight}px`
            rightItem.style.height = `${maxHeight}px`
          }
        }
      }
    }

    adjustHeights()
    window.addEventListener('resize', adjustHeights)
    return () => window.removeEventListener('resize', adjustHeights)
  }, [paragraphs, results])

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 text-white p-4">
        <nav className="flex justify-between items-center">
          <div className="flex space-x-4">
            <a href="#" className="hover:text-gray-300">首页</a>
            <a href="#" className="hover:text-gray-300">更新日志</a>
            <a href="#" className="hover:text-gray-300">留言板</a>
          </div>
          <div className="flex items-center space-x-4">
            <span>yl5545</span>
            <span>余额0元</span>
            <Button variant="outline">退出</Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto mt-8 p-4">
        <div className="mb-4 flex items-center space-x-4">
          <Button variant="outline">列表返回&gt;&gt;</Button>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择模型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt">限免GPT</SelectItem>
            </SelectContent>
          </Select>
          <Input 
            type="file" 
            onChange={handleFileUpload} 
            accept=".md" 
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
          />
          <Button>上传文件</Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div ref={leftColumnRef} className="space-y-4">
            {paragraphs.map((paragraph, index) => (
              <div key={index} className="bg-white p-4 rounded shadow flex flex-col">
                <div className="flex-grow mb-2 w-full overflow-y-auto">
                  {formatMarkdown(paragraph)}
                </div>
                <div className="mt-2 space-x-2">
                  <Button onClick={() => processText(paragraph, '英文润色', index)}>英文润色</Button>
                  <Button onClick={() => processText(paragraph, '指标解析', index)}>指标解析</Button>
                  <Button onClick={() => processText(paragraph, '中英互译', index)}>中英互译</Button>
                  <Button onClick={() => processText(paragraph, '自定义', index)}>自定义</Button>
                </div>
              </div>
            ))}
          </div>
          <div ref={rightColumnRef} className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="bg-white p-4 rounded shadow flex flex-col">
                <Textarea 
                  value={result} 
                  readOnly 
                  className="flex-grow w-full" 
                  aria-label={`Result for paragraph ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}