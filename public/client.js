import {
  html,
  render
} from 'https://unpkg.com/lit-html@2.2.0/lit-html.js?module'

export const $ = document.querySelector.bind(document)

export const toast = text => {
  $('#snackbar').labelText = text
  $('#snackbar').show()
}

export const displayProfile = profile => {
  render(html`<div></div>`, $('#profile'))
}

export const _fetch = async (path, payload = '') => {
  const headers = {
    'X-Requested-With': 'XMLHttpRequest'
  }
  if (payload && !(payload instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(payload)
  }
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: headers,
    body: payload
  })
  if (res.status === 200) {
    // Server authentication succeeded
    return res.json()
  } else {
    // Server authentication failed
    const result = await res.json()
    throw result.error
  }
}

class Loading {
  constructor () {
    this.progress = $('#progress')
  }
  start () {
    this.progress.indeterminate = true
  }
  stop () {
    this.progress.indeterminate = false
  }
}

export const loading = new Loading()

export const getCredential = async config => {
  const nonce = $('meta[name="nonce"]').content
  // MultiIDP is only available as behind a feature flag
  const providers = [
    {
      configURL: config.idpConfig.configURL,
      clientId: config.idpConfig.clientId
    }
  ]

  const providersWithNonce = providers.map(provider => {
    let newProvider = {
      ...provider,
      nonce: nonce
    }

    // Only add the scope if it's defined
    if (config && config.scope) {
      newProvider.scope = config.scope
    }

    return newProvider
  })

  let identity = {
    providers: providersWithNonce
  }

  // Only add the context if it's defined in the config
  if (config && config.context) {
    identity.context = config.context
  }

  // Only add the mediation if it's defined in the config
  if (config && config.mediation) {
    identity.mediation = config.mediation
  }

  console.log(identity)

  return navigator.credentials.get({
    identity: identity
  })
}

export const handleConfigSave = async () => {
  const scopeInput = $('#scope-input').value.split(',')
  const contextInput = $('#context-input').value
  const modeInput = $('#mode-input').value // Get the value of the mode input field
  const userInfoInput = document.getElementById('user-info-toggle').selected
  const mediationInput = $('#mediation-input').value // Get the value of the mediation mode input field

  const response = await fetch('/config-save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scopeInput,
      contextInput,
      modeInput,
      userInfoInput,
      mediationInput
    }) // Include modeInput in the object
  })

  if (response.ok) {
    // Configuration saved successfully, handle any necessary actions
    location.reload()
  } else {
    // Handle any error cases
    console.error('Failed to save configuration')
  }
}

export const switchTab = tabId => {
  // Hide all tabs
  $('#main-sections').classList.add('hidden')
  $('#settings-tab').classList.add('hidden')

  // Show the selected tab
  $(`#${tabId}`).classList.remove('hidden')
}

export const signout = account_id => async () => {
  try {
    loading.start()
    toast('You are signed out. Redirecting in 3.0 sec.')
    setTimeout(() => {
      location.href = '/signout'
    }, 3000)
  } catch (e) {
    loading.stop()
    console.error(e)
    toast(e.message)
  }
}

// create personlized button (IFrame served from IDP) at given div containerID
export const createIframe = (containerId, idpConfig) => {
  const iframe = document.createElement('iframe')
  const clientId = idpConfig.clientId
  const origin_idp = new URL(idpConfig.configURL).origin

  iframe.src = `${origin_idp}/fedcm/embedded?clientId=${encodeURIComponent(
    clientId
  )}`
  iframe.referrerPolicy = 'origin'
  iframe.allow = 'identity-credentials-get'

  const container = document.getElementById(containerId)

  if (container) {
    container.append(iframe)
  } else {
    console.warn(
      `Container with id ${containerId} not found. Appending iframe to body.`
    )
  }
}

export const submitIdpWildcardForm = async (event) => {
  // event.preventDefault();
  try {
    const idp = document.getElementById('idpInput').value;
    console.log(`submitting ${idp}`)
    await callChromeExtension(idp);

    // location.reload();
  } catch (e) {
    console.error(e);
    toast(e.message);
  }

  return false;
};

const callChromeExtension = async (idp) => {
  chrome.runtime.sendMessage({ message: idp }, function (response) {
    // Handle the response from the extension (if any)
    console.log("Response from extension:", response);
  });

  // chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
  //   var activeTab = tabs[0];
  //   console.log(`calling extension with ${idp}`)
  //   chrome.tabs.sendMessage(activeTab.id, { "message": idp });
  // });
};


submitIdpWildcardForm(null)
