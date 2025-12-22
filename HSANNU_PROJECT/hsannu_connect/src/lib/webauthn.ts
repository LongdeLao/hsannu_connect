/**
 * WebAuthn utility functions for encoding and decoding data
 */

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const normalized = normalizeBase64(base64);
  const binaryString = atob(normalized);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function normalizeBase64(input: string): string {
  // Trim, remove whitespace, convert base64url to base64, and pad
  let normalized = (input || '').trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const remainder = normalized.length % 4;
  if (remainder === 2) normalized += '==';
  else if (remainder === 3) normalized += '=';
  else if (remainder === 1) throw new Error('Invalid base64 string length');
  return normalized;
}

export interface PreparedCredential {
  id: string;
  rawId: string;
  type: string;
  response: Record<string, string>;
}

export function preparePublicKeyCredential(credential: PublicKeyCredential): PreparedCredential {
  const result: PreparedCredential = {
    id: credential.id,
    rawId: arrayBufferToBase64((credential as unknown as { rawId: ArrayBuffer }).rawId),
    type: credential.type,
    response: {},
  };

  const resp = credential.response as unknown as {
    clientDataJSON: ArrayBuffer;
    authenticatorData?: ArrayBuffer;
    signature?: ArrayBuffer;
    userHandle?: ArrayBuffer | null;
    attestationObject?: ArrayBuffer;
  };

  if (resp?.authenticatorData) {
    result.response.clientDataJSON = arrayBufferToBase64(resp.clientDataJSON);
    if (resp.authenticatorData) {
      result.response.authenticatorData = arrayBufferToBase64(resp.authenticatorData);
    }
    if (resp.signature) {
      result.response.signature = arrayBufferToBase64(resp.signature);
    }
    if (resp.userHandle) {
      result.response.userHandle = arrayBufferToBase64(resp.userHandle);
    }
  }

  if (resp?.attestationObject) {
    result.response.clientDataJSON = arrayBufferToBase64(resp.clientDataJSON);
    result.response.attestationObject = arrayBufferToBase64(resp.attestationObject);
  }

  return result;
}

export function createCredentialRequestOptions(beginData: { challenge: string; credentialIds: string[]; }): PublicKeyCredentialRequestOptions {
  const challenge = base64ToArrayBuffer(beginData.challenge);
  const allowCredentials = beginData.credentialIds.map((id) => ({
    id: base64ToArrayBuffer(id),
    type: 'public-key' as const,
  }));

  return {
    challenge,
    allowCredentials,
    timeout: 60000,
    userVerification: 'preferred',
  };
}

export function createCredentialCreationOptions(
  beginData: { challenge: string; relyingPartyId: string },
  user: { id: number | string; username: string; name?: string }
): PublicKeyCredentialCreationOptions {
  const challenge = base64ToArrayBuffer(beginData.challenge);

  return {
    challenge,
    rp: {
      name: 'HSANNU Connect',
      id: beginData.relyingPartyId,
    },
    user: {
      id: new TextEncoder().encode(String(user.id)),
      name: user.username,
      displayName: user.name || user.username,
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },
      { type: 'public-key', alg: -257 },
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'preferred',
      requireResidentKey: false,
    },
    timeout: 60000,
    attestation: 'none',
  } as PublicKeyCredentialCreationOptions;
}

export function isWebAuthnSupported(): boolean {
  return typeof window !== 'undefined' && (window as unknown as { PublicKeyCredential?: unknown }).PublicKeyCredential !== undefined;
} 