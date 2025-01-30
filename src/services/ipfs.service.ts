

class IpfsService {
    private gatewayUrl = 'https://ipfs.io'

    public async getIPFSData(CID: string): Promise<string> {
        console.log(`LOOK AT THIS: ${this.gatewayUrl}/${CID}`);
        const response = await fetch(`${this.gatewayUrl}/${CID}`)
        return await response.text()
    }
}


const ipfsService = new IpfsService()
export default ipfsService