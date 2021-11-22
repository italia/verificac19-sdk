/**
 * The shape of a Rule
 */
export type Rule = {
  name: string,
  type: string,
  value: string
}

/**
 * The certificate for each kid
 */
export type Signatures = Record<string, string>

/**
 * The list of kids
 */
export type SignaturesList = string[]

/**
 * The shape of a Rule result
 */
export type RulesResult = {
  result: boolean;
  code: string;
  message: string;
}
