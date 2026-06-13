import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import type { TestResult } from './types'

const Card = styled.div`
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 2rem;
  max-width: 480px;
`

const Metrics = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin: 1.5rem 0;
`

const Metric = styled.div`
  text-align: center;
`

const MetricValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
`

const MetricLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.3rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const Detail = styled.p`
  font-size: 0.85rem;
  color: #888;
  margin: 0 0 1.5rem;
`

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
`

const Button = styled.button`
  padding: 0.6rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: #1a1a1a;
  color: #fff;

  &:hover {
    background: #333;
  }
`

const SecondaryButton = styled(Button)`
  background: #e8e8e8;
  color: #1a1a1a;

  &:hover {
    background: #d4d4d4;
  }
`

export function ResultsScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const result = location.state as TestResult | null

  if (!result) {
    return (
      <div>
        <h1>Results</h1>
        <p>No result to show. <a href="#/">Take a test first.</a></p>
      </div>
    )
  }

  const elapsed = result.elapsedSec < 60
    ? `${result.elapsedSec.toFixed(1)} s`
    : `${Math.floor(result.elapsedSec / 60)}m ${Math.round(result.elapsedSec % 60)}s`

  return (
    <div>
      <h1>Results</h1>
      <Card>
        <Metrics>
          <Metric>
            <MetricValue>{result.wpm}</MetricValue>
            <MetricLabel>WPM</MetricLabel>
          </Metric>
          <Metric>
            <MetricValue>{result.cpm}</MetricValue>
            <MetricLabel>CPM</MetricLabel>
          </Metric>
          <Metric>
            <MetricValue>{elapsed}</MetricValue>
            <MetricLabel>Time</MetricLabel>
          </Metric>
        </Metrics>
        <Detail>
          {result.wordCount} words · {result.charCount} chars · {result.mode} mode
        </Detail>
        <Actions>
          <Button onClick={() => navigate('/')}>New Passage</Button>
          <SecondaryButton onClick={() => navigate(-1)}>Try Again</SecondaryButton>
        </Actions>
      </Card>
    </div>
  )
}
