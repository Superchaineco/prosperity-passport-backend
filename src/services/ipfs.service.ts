class IpfsService {
  private gatewayUrl = 'https://ipfs.io';

  public async getIPFSData(CID: string): Promise<string> {
    try {

      const response = await fetch(`${this.gatewayUrl}/${CID}`);
      return await response.text();
    } catch (error: any) {
      console.error(`Error when trying to fetch ${CID} \nError: ${error}`)
    }
  }
}

const ipfsService = new IpfsService();
export default ipfsService;
