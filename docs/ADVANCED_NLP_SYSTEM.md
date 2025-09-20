# Advanced NLP System for Calendar Parsing

This guide covers the comprehensive Natural Language Processing system for parsing complex scheduling statements with advanced features like conflict detection, timezone handling, and confidence scoring.

## Overview

The Advanced NLP System provides:
- **Sophisticated prompt engineering** for calendar parsing
- **Date/time extraction** with timezone handling
- **Recurrence pattern recognition** for recurring events
- **Conflict detection and resolution** for scheduling conflicts
- **Confidence scoring** for parsed events
- **Pattern recognition** for user behavior analysis

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Use the NLP system:**
   ```typescript
   import { createAdvancedNLPSystem, createDefaultNLPSystemConfig } from '@/lib/nlp/nlp-system'
   
   const config = createDefaultNLPSystemConfig('America/New_York')
   const nlpSystem = createAdvancedNLPSystem(config)
   
   const analysis = await nlpSystem.analyzeScheduleInput(
     "Meeting with client every Monday at 9 AM for 2 hours",
     existingEvents
   )
   ```

## Core Components

### 1. Calendar Parser (`calendar-parser.ts`)

The main parser that converts natural language into structured calendar events.

```typescript
import { CalendarNLPParser } from '@/lib/nlp/calendar-parser'

const parser = new CalendarNLPParser('America/New_York')
const result = await parser.parseScheduleInput(
  "I have work at 2:30 on Tuesday, Wednesday, Thursday",
  existingEvents
)
```

**Features:**
- Advanced prompt engineering with context awareness
- Timezone-aware date/time parsing
- Conflict detection with existing events
- Confidence scoring for each event
- Support for multiple events in single input

### 2. Timezone Utils (`timezone-utils.ts`)

Comprehensive timezone handling utilities.

```typescript
import { TimezoneUtils } from '@/lib/nlp/timezone-utils'

const tzUtils = new TimezoneUtils('America/New_York')
const userTime = tzUtils.toUserTimezone(utcDate)
const formatted = tzUtils.formatInUserTimezone(date, 'yyyy-MM-dd HH:mm')
```

**Features:**
- Timezone conversion between UTC and user timezone
- Relative date parsing ("today", "tomorrow", "next week")
- Time parsing with 12/24 hour format support
- Working hours validation
- DST handling

### 3. Recurrence Parser (`recurrence-parser.ts`)

Advanced recurrence pattern recognition and RRULE generation.

```typescript
import { RecurrenceParser } from '@/lib/nlp/recurrence-parser'

const recurrenceParser = new RecurrenceParser()
const result = recurrenceParser.parseRecurrence("every Tuesday and Thursday")
```

**Features:**
- Natural language recurrence parsing
- RRULE generation (RFC 5545 compliant)
- Human-readable descriptions
- Next occurrence calculation
- Complex pattern support (e.g., "first Monday of each month")

### 4. Conflict Detector (`conflict-detector.ts`)

Sophisticated conflict detection and resolution system.

```typescript
import { ConflictDetector } from '@/lib/nlp/conflict-detector'

const detector = new ConflictDetector()
const analysis = detector.analyzeConflicts(events)
```

**Features:**
- Time overlap detection
- Travel time conflict analysis
- Energy mismatch detection
- Resource conflict detection
- Automatic resolution suggestions

### 5. Confidence Scorer (`confidence-scorer.ts`)

Advanced confidence scoring for parsed events.

```typescript
import { ConfidenceScorer } from '@/lib/nlp/confidence-scorer'

const scorer = new ConfidenceScorer(userPatterns)
const score = scorer.calculateConfidence(event, originalInput)
```

**Features:**
- Multi-factor confidence analysis
- User pattern consistency checking
- Ambiguity detection
- Completeness assessment
- Improvement suggestions

### 6. Main NLP System (`nlp-system.ts`)

Integrated system that combines all components.

```typescript
import { createAdvancedNLPSystem } from '@/lib/nlp/nlp-system'

const nlpSystem = createAdvancedNLPSystem(config)
const analysis = await nlpSystem.analyzeScheduleInput(input, existingEvents)
```

## API Endpoints

### Analyze Schedule Input

**POST** `/api/nlp/analyze`

```json
{
  "input": "Meeting with client every Monday at 9 AM for 2 hours",
  "timezone": "America/New_York",
  "existingEvents": [
    {
      "id": "event-1",
      "title": "Team Standup",
      "startTime": "2024-01-15T09:00:00Z",
      "endTime": "2024-01-15T09:30:00Z",
      "location": "Conference Room A"
    }
  ],
  "options": {
    "context": "work schedule",
    "workingHours": {
      "start": "09:00",
      "end": "17:00"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event-123",
        "title": "Meeting with client",
        "startDate": "2024-01-15T14:00:00Z",
        "endDate": "2024-01-15T16:00:00Z",
        "isAllDay": false,
        "recurrence": {
          "rule": "FREQ=WEEKLY;BYDAY=MO",
          "pattern": "Every Monday"
        },
        "location": null,
        "confidence": 0.95,
        "conflicts": [],
        "metadata": {
          "source": "user_input",
          "priority": "medium",
          "category": "work"
        }
      }
    ],
    "conflicts": {
      "conflicts": [],
      "totalConflicts": 0,
      "criticalConflicts": 0,
      "suggestions": [],
      "overallSeverity": "low",
      "resolutionStrategies": []
    },
    "confidence": {
      "overall": 0.95,
      "factors": {
        "timeClarity": 0.9,
        "dateClarity": 0.8,
        "locationClarity": 0.5,
        "titleClarity": 0.9,
        "contextRelevance": 0.9,
        "ambiguityLevel": 0.9,
        "completeness": 0.8,
        "consistency": 0.9
      },
      "breakdown": {
        "timeScore": 0.9,
        "dateScore": 0.8,
        "locationScore": 0.5,
        "titleScore": 0.9,
        "contextScore": 0.9,
        "ambiguityScore": 0.9,
        "completenessScore": 0.8,
        "consistencyScore": 0.9
      },
      "suggestions": [
        "Include the location if relevant (e.g., 'meeting at the office')"
      ],
      "warnings": []
    },
    "recurrence": {
      "hasRecurrence": true,
      "pattern": {
        "rule": {
          "frequency": "WEEKLY",
          "interval": 1,
          "byDay": ["MO"]
        },
        "rrule": "FREQ=WEEKLY;BYDAY=MO",
        "description": "Every Monday",
        "nextOccurrences": [
          "2024-01-15T14:00:00Z",
          "2024-01-22T14:00:00Z",
          "2024-01-29T14:00:00Z"
        ]
      },
      "confidence": 0.9,
      "suggestions": []
    },
    "suggestions": [
      "Include the location if relevant (e.g., 'meeting at the office')"
    ],
    "warnings": [],
    "metadata": {
      "processingTime": 150,
      "timezone": "America/New_York",
      "totalEvents": 1,
      "hasConflicts": false,
      "overallConfidence": 0.95
    }
  }
}
```

### Get System Information

**GET** `/api/nlp/analyze`

```json
{
  "success": true,
  "data": {
    "system": {
      "timezone": "UTC",
      "userPatterns": {
        "preferredTimes": ["09:00", "14:00", "16:00"],
        "preferredDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "commonLocations": ["Office", "Home", "Conference Room"],
        "eventCategories": ["work", "personal", "meeting"],
        "averageDuration": 60,
        "workingHours": { "start": "09:00", "end": "17:00" }
      },
      "conflictDetectionEnabled": true,
      "confidenceScoringEnabled": true,
      "recurrenceParsingEnabled": true
    },
    "capabilities": {
      "conflictDetection": true,
      "confidenceScoring": true,
      "recurrenceParsing": true,
      "timezoneHandling": true,
      "patternRecognition": true
    },
    "supportedTimezones": [
      "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
      "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Shanghai",
      "Asia/Kolkata", "Australia/Sydney", "Pacific/Auckland"
    ]
  }
}
```

## Advanced Features

### 1. Sophisticated Prompt Engineering

The system uses advanced prompt engineering techniques:

```typescript
// System prompt includes context awareness
const systemPrompt = `
You are an expert calendar assistant that parses natural language into structured calendar events.

CURRENT TIMEZONE: ${timezone}
CURRENT DATE: ${currentDate}
EXISTING EVENTS: ${eventsList}
WORKING HOURS: ${workingHours}
USER PREFERENCES: ${userPreferences}

Parse user input and extract calendar events with this JSON structure:
{
  "events": [...],
  "message": "Human-friendly confirmation message",
  "needsClarification": boolean,
  "clarificationQuestions": [...],
  "suggestions": [...],
  "warnings": [...]
}

PARSING RULES:
1. Handle relative dates: "today", "tomorrow", "next week"
2. Default meeting duration: 1 hour if not specified
3. Recognize time patterns: "every Tuesday", "daily", "weekly"
4. Extract locations from context
5. Detect conflicts with existing events
6. Handle multiple events in single input
7. Use 24-hour format internally
8. Consider travel time between events
`
```

### 2. Date/Time Extraction with Timezone Handling

```typescript
// Parse relative dates
const relativeDate = timezoneUtils.parseRelativeDate("tomorrow")
const timeOnly = timezoneUtils.parseTime("2:30 PM")
const dateTime = timezoneUtils.parseDateTime("next Monday at 9 AM")

// Convert between timezones
const userTime = timezoneUtils.toUserTimezone(utcDate)
const utcTime = timezoneUtils.toUTC(userDate)

// Format in user timezone
const formatted = timezoneUtils.formatInUserTimezone(date, 'yyyy-MM-dd HH:mm')
```

### 3. Recurrence Pattern Recognition

```typescript
// Parse recurrence patterns
const recurrence = recurrenceParser.parseRecurrence("every Tuesday and Thursday")

// Generate RRULE
const rrule = recurrenceParser.generateRRULE("every Monday")

// Get next occurrences
const nextOccurrences = recurrenceParser.generateNextOccurrences(rule, 5)
```

**Supported Patterns:**
- "every day" → `FREQ=DAILY`
- "every Tuesday" → `FREQ=WEEKLY;BYDAY=TU`
- "every 2 weeks" → `FREQ=WEEKLY;INTERVAL=2`
- "monthly on the 15th" → `FREQ=MONTHLY;BYMONTHDAY=15`
- "weekdays" → `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR`
- "first Monday of each month" → `FREQ=MONTHLY;BYDAY=1MO`

### 4. Conflict Detection and Resolution

```typescript
// Analyze conflicts
const analysis = conflictDetector.analyzeConflicts(events)

// Conflict types
interface ConflictInfo {
  type: 'overlap' | 'same_time' | 'travel_time' | 'insufficient_break' | 'energy_mismatch' | 'resource_conflict'
  severity: 'low' | 'medium' | 'high' | 'critical'
  conflictingEvent: string
  suggestion: string
  resolution?: ConflictResolution
}
```

**Conflict Types:**
- **Overlap**: Events scheduled at the same time
- **Same Time**: Events at exactly the same time
- **Travel Time**: Insufficient time between locations
- **Insufficient Break**: Not enough break time between events
- **Energy Mismatch**: Conflicting energy levels
- **Resource Conflict**: Shared resources at same time

### 5. Confidence Scoring

```typescript
// Calculate confidence score
const score = confidenceScorer.calculateConfidence(event, originalInput)

// Confidence factors
interface ConfidenceFactors {
  timeClarity: number      // How clear the time specification is
  dateClarity: number      // How clear the date specification is
  locationClarity: number  // How clear the location is
  titleClarity: number     // How clear the event title is
  contextRelevance: number // How relevant to calendar context
  ambiguityLevel: number   // How ambiguous the input is
  completeness: number     // How complete the event information is
  consistency: number      // How consistent with user patterns
}
```

**Confidence Levels:**
- **0.9-1.0**: All details clear, no ambiguity
- **0.7-0.8**: Most details clear, minor ambiguity
- **0.5-0.6**: Some details unclear, needs clarification
- **0.0-0.4**: Highly ambiguous, requires user input

## Usage Examples

### Basic Event Parsing

```typescript
import { createAdvancedNLPSystem, createDefaultNLPSystemConfig } from '@/lib/nlp/nlp-system'

const config = createDefaultNLPSystemConfig('America/New_York')
const nlpSystem = createAdvancedNLPSystem(config)

// Parse simple event
const analysis = await nlpSystem.analyzeScheduleInput(
  "Meeting with client tomorrow at 2 PM",
  existingEvents
)

console.log(analysis.events[0].title) // "Meeting with client"
console.log(analysis.confidence.overall) // 0.85
```

### Recurring Events

```typescript
// Parse recurring event
const analysis = await nlpSystem.analyzeScheduleInput(
  "Team standup every weekday at 9 AM for 30 minutes",
  existingEvents
)

console.log(analysis.recurrence.hasRecurrence) // true
console.log(analysis.recurrence.pattern?.rrule) // "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR"
```

### Complex Scheduling

```typescript
// Parse multiple events with conflicts
const analysis = await nlpSystem.analyzeScheduleInput(
  "I have work at 2:30 on Tuesday, Wednesday, Thursday but 1:00 on Saturday and 12:00 on Sunday",
  existingEvents
)

console.log(analysis.events.length) // 5
console.log(analysis.conflicts.totalConflicts) // 0
console.log(analysis.metadata.overallConfidence) // 0.92
```

### Conflict Detection

```typescript
// Analyze conflicts
const analysis = await nlpSystem.analyzeScheduleInput(
  "Meeting at 2 PM tomorrow",
  [
    {
      id: "existing-1",
      title: "Existing Meeting",
      startTime: new Date("2024-01-16T19:00:00Z"),
      endTime: new Date("2024-01-16T20:00:00Z"),
      location: "Conference Room A"
    }
  ]
)

if (analysis.conflicts.totalConflicts > 0) {
  console.log("Conflicts detected:")
  analysis.conflicts.conflicts.forEach(conflict => {
    console.log(`- ${conflict.type}: ${conflict.suggestion}`)
  })
}
```

## Configuration

### System Configuration

```typescript
interface NLPSystemConfig {
  timezone: string
  userPatterns: UserPatterns
  conflictDetection: boolean
  confidenceScoring: boolean
  recurrenceParsing: boolean
}

interface UserPatterns {
  preferredTimes: string[]        // e.g., ['09:00', '14:00']
  preferredDays: string[]         // e.g., ['Monday', 'Tuesday']
  commonLocations: string[]       // e.g., ['Office', 'Home']
  eventCategories: string[]       // e.g., ['work', 'personal']
  averageDuration: number         // in minutes
  workingHours: { start: string; end: string }
}
```

### Custom Configuration

```typescript
const customConfig: NLPSystemConfig = {
  timezone: 'America/Los_Angeles',
  userPatterns: {
    preferredTimes: ['10:00', '15:00', '17:00'],
    preferredDays: ['Tuesday', 'Wednesday', 'Thursday'],
    commonLocations: ['Home Office', 'Client Site', 'Coffee Shop'],
    eventCategories: ['work', 'personal', 'meeting', 'focus'],
    averageDuration: 45,
    workingHours: { start: '10:00', end: '18:00' }
  },
  conflictDetection: true,
  confidenceScoring: true,
  recurrenceParsing: true
}

const nlpSystem = createAdvancedNLPSystem(customConfig)
```

## Error Handling

### Input Validation

```typescript
const validation = nlpSystem.validateInput(input)
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors)
  return
}
```

### Error Recovery

```typescript
try {
  const analysis = await nlpSystem.analyzeScheduleInput(input, existingEvents)
} catch (error) {
  if (error.message.includes('timezone')) {
    // Handle timezone errors
  } else if (error.message.includes('parsing')) {
    // Handle parsing errors
  } else {
    // Handle general errors
  }
}
```

## Performance Optimization

### Caching

```typescript
// Cache user patterns
const userPatterns = await getUserPatterns(userId)
nlpSystem.updateUserPatterns(userPatterns)

// Cache timezone
nlpSystem.updateTimezone(userTimezone)
```

### Batch Processing

```typescript
// Process multiple inputs
const inputs = ["Meeting at 2 PM", "Call at 3 PM", "Lunch at 12 PM"]
const analyses = await Promise.all(
  inputs.map(input => nlpSystem.analyzeScheduleInput(input, existingEvents))
)
```

### Memory Management

```typescript
// Clean up after processing
nlpSystem = null
```

## Testing

### Unit Tests

```typescript
import { createAdvancedNLPSystem } from '@/lib/nlp/nlp-system'

describe('NLP System', () => {
  test('parses simple event', async () => {
    const nlpSystem = createAdvancedNLPSystem(createDefaultNLPSystemConfig())
    const analysis = await nlpSystem.analyzeScheduleInput('Meeting at 2 PM')
    
    expect(analysis.events).toHaveLength(1)
    expect(analysis.events[0].title).toBe('Meeting')
  })
})
```

### Integration Tests

```typescript
test('handles timezone conversion', async () => {
  const config = createDefaultNLPSystemConfig('America/New_York')
  const nlpSystem = createAdvancedNLPSystem(config)
  
  const analysis = await nlpSystem.analyzeScheduleInput('Meeting at 2 PM')
  const event = analysis.events[0]
  
  expect(event.startDate.getHours()).toBe(14) // 2 PM in user timezone
})
```

## Deployment

### Environment Variables

```env
# Required
OPENAI_API_KEY=your-openai-api-key

# Optional
NLP_DEFAULT_TIMEZONE=UTC
NLP_CONFLICT_DETECTION=true
NLP_CONFIDENCE_SCORING=true
NLP_RECURRENCE_PARSING=true
```

### Production Considerations

- Enable caching for user patterns
- Implement rate limiting for API calls
- Set up monitoring for parsing accuracy
- Configure proper error logging
- Use connection pooling for database operations

## Support

For issues and questions:
- Check the API documentation
- Review error logs and monitoring
- Test with minimal examples
- Verify OpenAI API configuration
- Check timezone settings
