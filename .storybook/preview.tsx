import type { Decorator, Preview } from '@storybook/react'
import { GlobalStyle } from '../src/app/GlobalStyle'

const withTheme: Decorator = (Story, ctx) => {
  const theme = (ctx.globals['theme'] as string | undefined) ?? 'purple'
  const darkRaw = ctx.globals['dark']
  const isDark = darkRaw === true || darkRaw === 'true'

  document.documentElement.setAttribute('data-theme', theme)
  if (isDark) {
    document.documentElement.setAttribute('data-dark', '')
  } else {
    document.documentElement.removeAttribute('data-dark')
  }

  return (
    <>
      <GlobalStyle />
      <div style={{ padding: '1.5rem', minHeight: '100vh', background: 'var(--surface)' }}>
        <Story />
      </div>
    </>
  )
}

const withStorage: Decorator = (Story, ctx) => {
  const storage: unknown = ctx.parameters['storage']
  if (storage === null) {
    localStorage.removeItem('sst.v1')
  } else if (storage !== undefined) {
    localStorage.setItem('sst.v1', JSON.stringify(storage))
  }
  return <Story />
}

export const globalTypes = {
  theme: {
    description: 'Colour theme',
    defaultValue: 'purple',
    toolbar: {
      icon: 'circlehollow',
      items: ['purple', 'blue', 'orange', 'red'],
      dynamicTitle: true,
    },
  },
  dark: {
    description: 'Dark mode',
    defaultValue: false,
    toolbar: {
      icon: 'moon',
      items: [
        { value: false, title: 'Light' },
        { value: true, title: 'Dark' },
      ],
    },
  },
}

const preview: Preview = {
  decorators: [withStorage, withTheme],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
}

export default preview
