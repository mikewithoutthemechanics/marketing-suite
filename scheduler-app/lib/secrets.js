const db = require('./db');
const Vault = require('node-vault');

const VAULT_ADDR = process.env.VAULT_ADDR;
const VAULT_TOKEN = process.env.VAULT_TOKEN;

let vault = null;
if (VAULT_ADDR && VAULT_TOKEN) {
  vault = Vault({ endpoint: VAULT_ADDR, token: VAULT_TOKEN });
}

async function getProviderConfig(provider) {
  if (vault) {
    try {
      const secret = await vault.read(`secret/data/marketing-scheduler/providers/${provider}`);
      // Vault KV v2: secret.data.data
      return secret?.data?.data || null;
    } catch (e) {
      return db.getProviderConfig(provider); // fallback
    }
  }
  return db.getProviderConfig(provider);
}

async function setProviderConfig(provider, config) {
  if (vault) {
    try {
      await vault.write(`secret/data/marketing-scheduler/providers/${provider}`, { data: config });
      return true;
    } catch (e) {
      // fallback to DB
      db.setProviderConfig(provider, config);
      return false;
    }
  }
  db.setProviderConfig(provider, config);
  return true;
}

async function vaultHealthy() {
  if (!vault) return false;
  try {
    const status = await vault.health();
    return !!status;
  } catch (e) {
    return false;
  }
}

module.exports = { getProviderConfig, setProviderConfig, vaultHealthy };
