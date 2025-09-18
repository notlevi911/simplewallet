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

  // Self.xyz Identity Verification Hub V2 address
  // TODO: Update with actual Self.xyz Hub V2 address for the target network
  const identityVerificationHubV2Address = m.getParameter(
    "identityVerificationHubV2Address",
    "0x0000000000000000000000000000000000000001" // Placeholder - needs real address
  );

  // Deploy the SelfKYCVerifier contract
  const selfKYCVerifier = m.contract("SelfKYCVerifier", [
    identityVerificationHubV2Address,
    scope,
    configId,
    requireOfacCheck,
    minimumAge,
    excludedCountries,
    allowedDocumentTypes,
  ]);

  // Return the deployed contract for use in other modules or scripts
  return { selfKYCVerifier };
});

export default SelfKYCVerifierModule;