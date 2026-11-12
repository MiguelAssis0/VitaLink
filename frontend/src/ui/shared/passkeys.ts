import { getPasskeyAuthenticationOptions, getPasskeyRegistrationOptions, loginWithPasskey, savePasskey } from '../../api'

type CredentialDescriptorJson = { id: string; type?: 'public-key'; transports?: AuthenticatorTransport[] }
type CreationOptionsJson = Record<string, unknown> & { challenge: string; user: { id: string }; excludeCredentials?: CredentialDescriptorJson[] }
type RequestOptionsJson = Record<string, unknown> & { challenge: string; allowCredentials?: CredentialDescriptorJson[] }

function decode(value: string) {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '='))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer
}

function encode(value: ArrayBuffer | null) {
  if (!value) return null
  let binary = ''
  for (const byte of new Uint8Array(value)) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function credentialJson(credential: PublicKeyCredential) {
  const response = credential.response
  const data = response instanceof AuthenticatorAttestationResponse
    ? { attestationObject: encode(response.attestationObject), clientDataJSON: encode(response.clientDataJSON) }
    : {
        authenticatorData: encode((response as AuthenticatorAssertionResponse).authenticatorData), clientDataJSON: encode(response.clientDataJSON),
        signature: encode((response as AuthenticatorAssertionResponse).signature), userHandle: encode((response as AuthenticatorAssertionResponse).userHandle),
      }
  return {
    id: credential.id, rawId: encode(credential.rawId), type: credential.type,
    response: data, clientExtensionResults: credential.getClientExtensionResults(),
    authenticatorAttachment: credential.authenticatorAttachment,
  }
}

export async function registerPasskey() {
  if (!navigator.credentials?.create || !window.isSecureContext) throw new Error('Este navegador precisa oferecer passkeys em uma conexão segura.')
  const options = await getPasskeyRegistrationOptions() as CreationOptionsJson
  const credential = await navigator.credentials.create({ publicKey: {
    ...options, challenge: decode(options.challenge), user: { ...options.user, id: decode(options.user.id) },
    excludeCredentials: options.excludeCredentials?.map((item) => ({ ...item, id: decode(item.id) })),
  } as PublicKeyCredentialCreationOptions })
  if (!(credential instanceof PublicKeyCredential)) throw new Error('O aparelho não criou uma chave de acesso.')
  await savePasskey(credentialJson(credential))
}

export async function authenticatePasskey() {
  if (!navigator.credentials?.get || !window.isSecureContext) throw new Error('Este navegador precisa oferecer passkeys em uma conexão segura.')
  const options = await getPasskeyAuthenticationOptions() as RequestOptionsJson
  const credential = await navigator.credentials.get({ publicKey: {
    ...options, challenge: decode(options.challenge),
    allowCredentials: options.allowCredentials?.map((item) => ({ ...item, id: decode(item.id) })),
  } as PublicKeyCredentialRequestOptions })
  if (!(credential instanceof PublicKeyCredential)) throw new Error('O aparelho não verificou uma chave de acesso.')
  return loginWithPasskey(credentialJson(credential))
}
