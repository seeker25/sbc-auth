import {
  Affiliation,
  AffiliationResponse,
  CreateRequestBody as CreateAffiliationRequestBody
} from '@/models/affiliation'
import {
  CreateRequestBody as CreateOrganizationRequestBody,
  Member,
  Members,
  OrgPaymentDetails,
  OrgProduct,
  OrgProductsRequestBody,
  Organization,
  PatchOrgPayload,
  UpdateMemberPayload
} from '@/models/Organization'

import { Address } from '@/models/address'
import { AxiosResponse } from 'axios'
import ConfigHelper from '@/util/config-helper'
import { Invitations } from '@/models/Invitation'
import { OrgsDetails } from '@/models/affiliation-invitation'
import { axios } from '@/util/http-util'

export default class OrgService {
  public static async getOrganizationsSimple (query: string): Promise<AxiosResponse<Organization[]>> {
    try {
      const url = `${ConfigHelper.getAuthAPIUrl()}/orgs/simple`
      const searchParams = new URLSearchParams({ 'limit': '20' })
      if (query) { searchParams.append('searchText', query) }
      const response = await axios.get(url, { params: searchParams })
      return response.data.items
    } catch (error) {
      console.error(`Failed to get organizations: ${error}`)
      throw error
    }
  }

  public static async getOrganization (orgId: number): Promise<AxiosResponse<Organization>> {
    return axios.get(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgId}`)
  }

  public static async getOrganizationsNameAndUuidByAffiliation (businessIdentifier: string): Promise<OrgsDetails[]> {
    try {
      const response = await axios.get(`${ConfigHelper.getAuthAPIUrl()}/orgs/affiliation/${businessIdentifier}`)
      return response.data?.orgsDetails
    } catch (err) {
      // eslint-disable-line no-console
      console.log(err)
      return null
    }
  }

  public static async getContactForOrg (orgId: number): Promise<Address> {
    const response = await axios.get(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgId}/contacts`)
    // for now it returns only address , can return the all the contacts as well
    return response.data.contacts[0]
  }

  public static async isOrgNameAvailable (orgName: string, branchName: string): Promise<AxiosResponse> {
    return axios.get(`${ConfigHelper.getAuthAPIUrl()}/orgs`, {
      params: {
        'validateName': true,
        'name': orgName,
        ...(branchName ? { branchName: branchName } : {})
      }
    })
  }

  public static async getOrgMembers (orgId: number, status: string): Promise<AxiosResponse<Members>> {
    return axios.get(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgId}/members?status=${status}`)
  }

  public static async getOrgInvitations (orgId: number, status: string = 'ALL'): Promise<AxiosResponse<Invitations>> {
    return axios.get(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgId}/invitations?status=${status}`)
  }

  public static async deactivateOrg (orgId: number): Promise<AxiosResponse<void>> {
    return axios.delete(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgId}`)
  }

  public static async leaveOrg (orgId: number, memberId: number): Promise<AxiosResponse<Member>> {
    return axios.delete(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgId}/members/${memberId}`)
  }

  public static async updateMember (orgId: number, updatePayload: UpdateMemberPayload): Promise<AxiosResponse<Member>> {
    return axios.patch(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgId}/members/${updatePayload.memberId}`,
      { role: updatePayload.role, status: updatePayload.status, notifyUser: updatePayload.notifyUser })
  }

  public static async createOrg (createRequestBody: CreateOrganizationRequestBody):
    Promise<AxiosResponse<Organization>> {
    return axios.post(`${ConfigHelper.getAuthAPIUrl()}/orgs`, createRequestBody)
  }

  public static async updateOrg (orgId: number, createRequestBody: CreateOrganizationRequestBody):
    Promise<AxiosResponse<Organization>> {
    return axios.put(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgId}`, createRequestBody)
  }

  static async updateOrgMailingAddress (orgId: number, createRequestBody: CreateOrganizationRequestBody):
    Promise<AxiosResponse<Organization>> {
    return axios.put(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgId}/mailing-address`, createRequestBody)
  }

  static async getAffiliatedEntities (orgIdentifier: number): Promise<AffiliationResponse[]> {
    try {
      const response = await axios.get(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgIdentifier}/affiliations`, { params: { new: true } })
      if (response?.data?.entities && response?.status === 200) {
        return response.data.entities
      } else {
        throw Error(`Invalid response = ${response}`)
      }
    } catch (error) {
      throw new Error('Error fetching data from API: ' + error.message)
    }
  }

  static async createAffiliation (orgIdentifier: number, affiliation: CreateAffiliationRequestBody):
    Promise<AxiosResponse<Affiliation>> {
    return axios.post(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgIdentifier}/affiliations`, affiliation)
  }

  static async removeAffiliation (
    orgIdentifier: number, incorporationNumber: string, passcodeResetEmail?: string, resetPasscode?: boolean
  ): Promise<AxiosResponse<void>> {
    return axios.delete(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgIdentifier}/affiliations/${incorporationNumber}`,
      { data: { passcodeResetEmail: passcodeResetEmail, resetPasscode: resetPasscode, logDeleteDraft: true } })
  }

  static async approvePendingOrg (orgIdentifier: number): Promise<AxiosResponse> {
    return axios.patch(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgIdentifier}/status`, { statusCode: 'APPROVED' })
  }

  static async rejectPendingOrg (orgIdentifier: number): Promise<AxiosResponse> {
    return axios.patch(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgIdentifier}/status`, { statusCode: 'REJECTED' })
  }

  static async patchOrg (orgId: number, patchOrgPayload: PatchOrgPayload): Promise<AxiosResponse> {
    return axios.patch(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgId}`, { ...patchOrgPayload })
  }

  public static async getMemberLoginOption (orgId: number): Promise<string> {
    const response = await axios.get(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgId}/login-options`)
    return response.data?.loginOption
  }

  public static async updateMemberLoginOption (orgId: number, loginOption:string): Promise<string> {
    const response = await axios.put(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgId}/login-options`, {
      'loginOption': loginOption
    })
    return response.data?.loginOption
  }

  static async getOrgPayments (orgId: number): Promise<AxiosResponse<OrgPaymentDetails>> {
    return axios.get(`${ConfigHelper.getPayAPIURL()}/accounts/${orgId}`)
  }

  public static async getOrgForAffiliate (businessIdentifier: string): Promise<AxiosResponse<any>> {
    return axios.get(`${ConfigHelper.getAuthAPIUrl()}/orgs?affiliation=${businessIdentifier}`)
  }

  static async getProducts (orgIdentifier:number): Promise<AxiosResponse<OrgProduct[]>> {
    return axios.get(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgIdentifier}/products`)
  }

  public static async addProducts (orgIdentifier: number, productsRequestBody: OrgProductsRequestBody):
    Promise<AxiosResponse<OrgProduct>> {
    return axios.post(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgIdentifier}/products`, productsRequestBody)
  }

  public static async removeProduct (orgIdentifier: number, productCode: string):
    Promise<AxiosResponse<OrgProduct>> {
    return axios.delete(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgIdentifier}/products/${productCode}`)
  }

  public static async availableProducts (): Promise<AxiosResponse<OrgProduct>> {
    return axios.get(`${ConfigHelper.getAuthAPIUrl()}/products`)
  }

  public static async getOrgApiKeys (orgId: number): Promise<AxiosResponse<OrgProduct>> {
    return axios.get(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgId}/api-keys`)
  }

  public static async revokeOrgApiKeys (ApiDetails): Promise<AxiosResponse<OrgProduct>> {
    const { orgId, apiKey } = ApiDetails
    return axios.delete(`${ConfigHelper.getAuthAPIUrl()}/orgs/${orgId}/api-keys/${apiKey}`)
  }
}
