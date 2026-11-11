import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import App from './App'
import { EmergencyRequestPage } from './pages/citizen/EmergencyRequestPage'
import { EmergencyDetailsPage } from './pages/citizen/EmergencyDetailsPage'

afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('emergency contact', () => {
  it('keeps the emergency phone link visible on the login screen', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401, headers: { 'Content-Type': 'application/json' } })))
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Acessar minha conta' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ligar 192' })).toHaveAttribute('href', 'tel:192')
    expect(screen.getByRole('banner')).not.toHaveTextContent('AMBIENTE DE SIMULAÇÃO')
    const password = screen.getByLabelText('Senha')
    expect(password).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('does not claim a request was recorded while offline', async () => {
    vi.stubGlobal('navigator', { ...window.navigator, onLine: false })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })))
    render(<MemoryRouter><App /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText(/Sem conexão: pedidos não podem ser enviados/)).toBeInTheDocument())
    expect(screen.queryByText(/Solicitação registrada/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ligar 192' })).toBeInTheDocument()
  })
})

describe('patient registration', () => {
  it('requires adult confirmation and keeps the local no-email limitation visible', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401, headers: { 'Content-Type': 'application/json' } })))
    render(<MemoryRouter initialEntries={['/register']}><App /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Criar conta de cidadão' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Confirmo que tenho 18 anos ou mais.' })).not.toBeChecked()
    expect(screen.getByText(/O cadastro não envia confirmação por e-mail/)).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toHaveAttribute('minlength', '8')
    expect(screen.getByLabelText('Senha')).toHaveAttribute('pattern', expect.stringContaining('(?=.*[A-Z])'))
    expect(screen.getByRole('button', { name: 'Mostrar senha' })).toBeInTheDocument()
  })
})

describe('citizen requests', () => {
  it('prefills the saved address and offers current location', async () => {
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/patients/me/medical-profile')) {
        return Promise.resolve(new Response(JSON.stringify({ address: 'Rua das Flores, 12' }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      }
      return Promise.resolve(new Response('{}', { status: 401, headers: { 'Content-Type': 'application/json' } }))
    }))
    render(
      <MemoryRouter initialEntries={['/request']}>
        <Routes><Route path="/request" element={<EmergencyRequestPage />} /></Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByLabelText('Endereço')).toHaveValue('Rua das Flores, 12')
    expect(screen.getByRole('button', { name: 'Usar localização atual' })).toBeInTheDocument()
  })

  it('loads the request and its timeline in the tracking view', async () => {
    const id = '3531a6d8-48ca-4035-8408-846143744bf7'
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      const payload = url.endsWith(`/emergencies/${id}/events`)
        ? [{ oldStatus: null, status: 'REQUESTED', actorRole: 'PATIENT', actorLabel: 'Cidadão', occurredAt: '2026-11-06T12:00:00Z' }]
        : { id, simulation: true, status: 'REQUESTED', version: 0, createdAt: '2026-11-06T12:00:00Z' }
      return Promise.resolve(new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    }))
    render(
      <MemoryRouter initialEntries={[`/patient/emergencies/${id}`]}>
        <Routes><Route path="/patient/emergencies/:id" element={<EmergencyDetailsPage />} /></Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Solicitação recebida' })).toBeInTheDocument()
    expect(screen.getByText(/Cidadão/)).toBeInTheDocument()
  })

  it('keeps the request visible if its timeline cannot be loaded', async () => {
    const id = '38aa8cbe-d98c-49dc-8fe4-1a7bc93e84fd'
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      const response = url.endsWith(`/emergencies/${id}/events`)
        ? new Response('{}', { status: 500 })
        : new Response(JSON.stringify({ id, status: 'REQUESTED', createdAt: '2026-11-06T12:00:00Z' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      return Promise.resolve(response)
    }))
    render(
      <MemoryRouter initialEntries={[`/patient/emergencies/${id}`]}>
        <Routes><Route path="/patient/emergencies/:id" element={<EmergencyDetailsPage />} /></Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Solicitação recebida' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Solicitação carregada, mas o histórico está indisponível.')
  })
})
