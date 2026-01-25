"use client"

import React from "react"
import { useIDE } from "./IDEContext"
import MarkdownSection from "../editor/MarkdownSection"
import SimpleBrowser from "../editor/SimpleBrowser"
import EventCard from "../editor/EventCard"

export default function EditorPane() {
  const { activeFile } = useIDE()

  // Upcoming events gets special split layout
  if (activeFile === 'upcoming-events.py') {
    return <UpcomingEventsLayout />
  }

  const lineCount = 45

  return (
    <div 
      className="flex flex-1 overflow-auto ide-scrollable"
      style={{
        background: 'var(--ide-bg)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-base)',
        lineHeight: '1.75',
      }}
    >
      {/* Line Numbers Gutter */}
      <div 
        className="hidden sm:flex flex-col flex-shrink-0 py-3 select-none"
        style={{
          width: '50px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRight: '1px solid var(--ide-border)',
        }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <span 
            key={i} 
            className="h-[22px] pr-4 text-right"
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}
          >
            {i + 1}
          </span>
        ))}
      </div>
      
      {/* Editor Content */}
      <div className="flex-1 p-3 sm:p-6 overflow-auto ide-scrollable">
        {activeFile === 'welcome.md' && <WelcomeContent />}
        {activeFile === 'schedule.py' && <PlaceholderContent filename={activeFile} />}
        {activeFile === 'vibe-a-thon.py' && <PlaceholderContent filename={activeFile} />}
        {activeFile === 'speaker-signup.md' && <PlaceholderContent filename={activeFile} />}
        {activeFile === 'sponsor-info.md' && <PlaceholderContent filename={activeFile} />}
        {activeFile === 'sponsors.yaml' && <PlaceholderContent filename={activeFile} />}
        {activeFile === 'tickets.config.js' && <PlaceholderContent filename={activeFile} />}
      </div>
    </div>
  )
}

function UpcomingEventsLayout() {
  const techConnectDate = new Date('2026-02-10T10:00:00-08:00')

  return (
    <div 
      className="flex flex-col h-full"
      style={{ background: 'var(--ide-bg)' }}
    >
      {/* Simple Browser - Takes 80% of height */}
      <div className="flex-1 p-2" style={{ height: '80%', minHeight: 0 }}>
        <SimpleBrowser showBrowserTab={false}>
          <div className="p-4 sm:p-6 space-y-4 overflow-auto h-full ide-scrollable">
            {/* Page Header */}
            <div className="text-center mb-6">
              <h1 
                className="text-2xl font-bold mb-2"
                style={{ 
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text-primary)',
                }}
              >
                Upcoming Events
              </h1>
              <p 
                className="text-sm"
                style={{ 
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                All The Vibes Community Calendar
              </p>
            </div>

            {/* Featured Event - Tech Connect */}
            <EventCard
              title="All The Vibes @ Tech Connect"
              date="February 10, 2026"
              time="10:00 AM"
              timezone="PT"
              location="Redmond, WA"
              description="The biggest vibe coding event of the year"
              accentColor="var(--accent-cyan)"
              showCountdown={true}
              targetDate={techConnectDate}
            />

            {/* Recurring Events */}
            <EventCard
              title="Hack and Furious Call"
              date="Every Tuesday"
              time="10:00 AM - 11:00 AM"
              timezone="CT"
              description="Weekly coding sessions, show and tell, and sharing learnings."
              accentColor="var(--accent-pink)"
              isRecurring={true}
              recurringPattern="Every Tuesday"
            />

            <EventCard
              title="All The Vibes Community Call"
              date="Every Friday"
              time="11:00 AM"
              timezone="CT"
              description="Weekly community meeting, demos, and open forum."
              accentColor="var(--accent-yellow)"
              isRecurring={true}
              recurringPattern="Every Friday"
            />
          </div>
        </SimpleBrowser>
      </div>

      {/* Code Pane - Takes 20% of height */}
      <div 
        className="flex overflow-auto ide-scrollable"
        style={{
          height: '20%',
          minHeight: '120px',
          borderTop: '1px solid var(--ide-border)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-base)',
          lineHeight: '1.75',
        }}
      >
        {/* Line Numbers Gutter */}
        <div 
          className="hidden sm:flex flex-col flex-shrink-0 py-2 select-none"
          style={{
            width: '50px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRight: '1px solid var(--ide-border)',
          }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <span 
              key={i} 
              className="h-[20px] pr-4 text-right"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
              }}
            >
              {i + 1}
            </span>
          ))}
        </div>
        
        {/* Code Content */}
        <div className="flex-1 p-2 sm:p-3 overflow-auto ide-scrollable">
          <UpcomingEventsCode />
        </div>
      </div>
    </div>
  )
}

function UpcomingEventsCode() {
  return (
    <div style={{ fontSize: '12px', lineHeight: '20px' }}>
      <CodeLine><SyntaxSpan type="comment">{'# upcoming-events.py'}</SyntaxSpan></CodeLine>
      <CodeLine>
        <SyntaxSpan type="keyword">events</SyntaxSpan>
        <SyntaxSpan type="punctuation">{' = ['}</SyntaxSpan>
      </CodeLine>
      <CodeLine indent={1}>
        <SyntaxSpan type="punctuation">{'{'}</SyntaxSpan>
        <SyntaxSpan type="string">{'"name"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{': '}</SyntaxSpan>
        <SyntaxSpan type="string">{'"All The Vibes @ Tech Connect"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{', '}</SyntaxSpan>
        <SyntaxSpan type="string">{'"date"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{': '}</SyntaxSpan>
        <SyntaxSpan type="string">{'"2026-02-10"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{'}'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{','}</SyntaxSpan>
      </CodeLine>
      <CodeLine indent={1}>
        <SyntaxSpan type="punctuation">{'{'}</SyntaxSpan>
        <SyntaxSpan type="string">{'"name"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{': '}</SyntaxSpan>
        <SyntaxSpan type="string">{'"Hack and Furious Call"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{', '}</SyntaxSpan>
        <SyntaxSpan type="string">{'"schedule"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{': '}</SyntaxSpan>
        <SyntaxSpan type="string">{'"Tuesdays 10am CT"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{'}'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{','}</SyntaxSpan>
      </CodeLine>
      <CodeLine indent={1}>
        <SyntaxSpan type="punctuation">{'{'}</SyntaxSpan>
        <SyntaxSpan type="string">{'"name"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{': '}</SyntaxSpan>
        <SyntaxSpan type="string">{'"All The Vibes Community Call"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{', '}</SyntaxSpan>
        <SyntaxSpan type="string">{'"schedule"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{': '}</SyntaxSpan>
        <SyntaxSpan type="string">{'"Fridays 11am CT"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{'}'}</SyntaxSpan>
      </CodeLine>
      <CodeLine>
        <SyntaxSpan type="punctuation">{']'}</SyntaxSpan>
      </CodeLine>
    </div>
  )
}

function CodeLine({ children, indent = 0, empty = false }: { children?: React.ReactNode, indent?: number, empty?: boolean }) {
  return (
    <div 
      className="flex items-start whitespace-nowrap"
      style={{ 
        paddingLeft: `${indent * 16}px`,
        minHeight: '22px',
        lineHeight: '22px',
      }}
    >
      {empty ? <span>&nbsp;</span> : children}
    </div>
  )
}

function SyntaxSpan({ type, children }: { type: 'keyword' | 'string' | 'number' | 'comment' | 'property' | 'punctuation' | 'variable', children: React.ReactNode }) {
  const colors: Record<string, string> = {
    keyword: 'var(--syntax-keyword)',
    string: 'var(--syntax-string)',
    number: 'var(--syntax-number)',
    comment: 'var(--syntax-comment)',
    property: 'var(--syntax-property)',
    punctuation: 'var(--syntax-punctuation)',
    variable: 'var(--syntax-variable)',
  }
  
  return (
    <span style={{ color: colors[type], fontStyle: type === 'comment' ? 'italic' : 'normal' }}>
      {children}
    </span>
  )
}

function PlaceholderContent({ filename }: { filename: string }) {
  return (
    <>
      <CodeLine><SyntaxSpan type="comment">{'# ' + filename}</SyntaxSpan></CodeLine>
      <CodeLine><SyntaxSpan type="comment">{'# Coming soon...'}</SyntaxSpan></CodeLine>
      <CodeLine empty />
      <CodeLine>
        <SyntaxSpan type="keyword">print</SyntaxSpan>
        <SyntaxSpan type="punctuation">{'('}</SyntaxSpan>
        <SyntaxSpan type="string">{'"Check back for updates!"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{')'}</SyntaxSpan>
      </CodeLine>
    </>
  )
}

function WelcomeContent() {
  return (
    <>
      {/* Comments Block */}
      <CodeLine><SyntaxSpan type="comment">{'/*'}</SyntaxSpan></CodeLine>
      <CodeLine><SyntaxSpan type="comment">{'* ALL THE VIBES COMMUNITY'}</SyntaxSpan></CodeLine>
      <CodeLine><SyntaxSpan type="comment">{'* EST. SEPTEMBER 2025'}</SyntaxSpan></CodeLine>
      <CodeLine><SyntaxSpan type="comment">{'* Empowering every team member to leverage AI-assisted development'}</SyntaxSpan></CodeLine>
      <CodeLine><SyntaxSpan type="comment">{'* and redefine the full stack software engineer.'}</SyntaxSpan></CodeLine>
      <CodeLine><SyntaxSpan type="comment">{'*/'}</SyntaxSpan></CodeLine>
      <CodeLine><SyntaxSpan type="comment">{''}</SyntaxSpan></CodeLine>
      <CodeLine empty />
      
      {/* Const Declaration */}
      <CodeLine>
        <SyntaxSpan type="keyword">const</SyntaxSpan>
        <SyntaxSpan type="variable">{'AllTheVibes'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{' = {'}</SyntaxSpan>
      </CodeLine>
      <CodeLine indent={1}>
        <SyntaxSpan type="property">name</SyntaxSpan>
        <SyntaxSpan type="punctuation">{': '}</SyntaxSpan>
        <SyntaxSpan type="string">{'"All The Vibes Community 2025"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">,</SyntaxSpan>
      </CodeLine>
      <CodeLine indent={1}>
        <SyntaxSpan type="property">tagline</SyntaxSpan>
        <SyntaxSpan type="punctuation">{': '}</SyntaxSpan>
        <SyntaxSpan type="string">{'\"one shot.\"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">,</SyntaxSpan>
      </CodeLine>
      <CodeLine indent={1}>
        <SyntaxSpan type="property">venue</SyntaxSpan>
        <SyntaxSpan type="punctuation">{': '}</SyntaxSpan>
        <SyntaxSpan type="string">{'\"global\"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">,</SyntaxSpan>
      </CodeLine>
      <CodeLine indent={1}>
        <SyntaxSpan type="property">audience</SyntaxSpan>
        <SyntaxSpan type="punctuation">{': '}</SyntaxSpan>
        <SyntaxSpan type="string">{'\"Open to Everyone\"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">,</SyntaxSpan>
      </CodeLine>
      <CodeLine indent={1}>
        <SyntaxSpan type="property">tools</SyntaxSpan>
        <SyntaxSpan type="punctuation">{': ['}</SyntaxSpan>
      </CodeLine>
      <CodeLine indent={2}>
        <SyntaxSpan type="string">{'"GitHub Copilot"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{', '}</SyntaxSpan>
        <SyntaxSpan type="string">{'"Claude Code"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{', '}</SyntaxSpan>
        <SyntaxSpan type="string">{'"Codex"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{','}</SyntaxSpan>
      </CodeLine>
      <CodeLine indent={2}>
        <SyntaxSpan type="string">{'"Replit"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{', '}</SyntaxSpan>
        <SyntaxSpan type="string">{'"v0"'}</SyntaxSpan>
        <SyntaxSpan type="punctuation">{', '}</SyntaxSpan>
        <SyntaxSpan type="string">{'"Lovable"'}</SyntaxSpan>
      </CodeLine>
      <CodeLine indent={1}>
        <SyntaxSpan type="punctuation">{'],'}</SyntaxSpan>
      </CodeLine>
      <CodeLine indent={1}>
        <SyntaxSpan type="property">vibeLevel</SyntaxSpan>
        <SyntaxSpan type="punctuation">{': '}</SyntaxSpan>
        <SyntaxSpan type="number">110%</SyntaxSpan>
      </CodeLine>
      <CodeLine>
        <SyntaxSpan type="punctuation">{'};'}</SyntaxSpan>
      </CodeLine>
      <CodeLine empty />
      <CodeLine empty />
      
      {/* Markdown Rendered Section */}
      <MarkdownSection />
    </>
  )
}
