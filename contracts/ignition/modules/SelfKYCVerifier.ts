import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Hardhat Ignition deployment module for SelfKYCVerifier
 *
 * This module deploys the SelfKYCVerifier contract with configurable parameters
 * for different environments (testnet/mainnet) and KYC requirements.
 */

const SelfKYCVerifierModule = buildModule("SelfKYCVerifierModule", (m) => {
  // Configuration parameters with defaults for basic KYC setup
  const configId = m.getParameter("configId", 1);
  const scope = m.getParameter("scope", "your-app-kyc-v1");
  const requireOfacCheck = m.getParameter("requireOfacCheck", true);
  const minimumAge = m.getParameter("minimumAge", 18);

  // Document types: 1=E-Passport, 2=EU ID Card, 3=Aadhaar (India)
  const allowedDocumentTypes = m.getParameter("allowedDocumentTypes", [1, 2]);

  // Excluded countries (empty by default, can be configured)
  const excludedCountries = m.getParameter("excludedCountries", []);

  // Deploy the SelfKYCVerifier contract
  const selfKYCVerifier = m.contract("SelfKYCVerifier", [
    configId,
    scope,
    requireOfacCheck,
    minimumAge,
    excludedCountries,
    allowedDocumentTypes,
  ]);

  // Return the deployed contract for use in other modules or scripts
  return { selfKYCVerifier };
});

export default SelfKYCVerifierModule;