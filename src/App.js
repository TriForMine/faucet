import "./App.css";
import {useCallback, useEffect, useState} from "react";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";
import {loadContract} from "./utils/loadContract";
import {web3} from "@truffle/contract/lib/contract/constructorMethods";

function App() {
    const [web3Api, setWeb3Api] = useState({
        provider: null,
        isProviderLoaded: false,
        web3: null,
        contract: null
    })

    const [balance, setBalance] = useState(null)
    const [account, setAccount] = useState(null)
    const [shouldReload, reload] = useState(false)

    const canConnectToContract = account && web3Api.contract
    const reloadEffect = useCallback(() => reload(!shouldReload), [shouldReload])

    const setAccountListener = (provider) => {
        provider.on("accountsChanged", (accounts) => {
            window.location.reload()
        })

        provider.on("chainChanged", (chainId) => {
            window.location.reload()
        })
    }

    useEffect(() => {
        const loadProvider = async () => {
            const provider = await detectEthereumProvider();

            if (provider) {
                const contract = await loadContract("Faucet", provider);
                setAccountListener(provider)
                setWeb3Api({
                    web3: new Web3(provider),
                    provider,
                    contract,
                    isProviderLoaded: true
                })
            } else {
                console.log("Please install MetaMask!");
                setWeb3Api((api) => ({
                        ...api,
                        isProviderLoaded: true
                }))
            }
        }

        loadProvider()
    }, [])

    useEffect(() => {
        const loadBalance = async () => {
            const { contract, web3 } = web3Api
            const balance = await web3.eth.getBalance(contract.address)
            setBalance(web3.utils.fromWei(balance, "ether"))
        }

        web3Api.contract && loadBalance()
    }, [web3Api, shouldReload])

    useEffect(() => {
        const getAccount = async () => {
            const accounts = await web3Api.web3.eth.getAccounts();
            setAccount(accounts[0])
        }

        web3Api.web3 && getAccount()
    }, [web3Api.web3])

    const addFunds = useCallback(async () => {
        const { contract } = web3Api
        await contract.addFunds({
            from: account,
            value: web3Api.web3.utils.toWei("1", "ether")
        })

        reloadEffect()
    }, [web3Api, account])

    const withdrawFunds = useCallback(async () => {
        const { contract } = web3Api
        await contract.withdraw(web3Api.web3.utils.toWei("0.1", "ether"), {
            from: account,
        })

        reloadEffect()
    }, [web3Api, account])

    return (
        <>
            <div className="faucet-wrapper">
                <div className="faucet">
                    {
                        web3Api.isProviderLoaded ? <div className="is-flex is-align-items-center">
                            <span>
                                <strong className="mr-2">Account: </strong>
                            </span>
                            {account ?
                                <div>{account}</div> :
                                !web3Api.provider ?
                                    <div className="notification is-warning is-size-6 is-rounded">
                                        Wallet is not detected!{" "}
                                        <a target="_blank" rel="noreferrer" href="https://metamask.io/download.html">
                                            Install MetaMask
                                        </a>
                                    </div> :
                                    <button className="button is-small" onClick={
                                        () => web3Api.provider.request({method: "eth_requestAccounts"})
                                    }>
                                        Connect
                                    </button>
                            }
                        </div> : <span>Looking for Web3 provider...</span>
                    }
                    <div className="balance-view is-size-2 my-4">
                        Current Balance: <strong>{balance}</strong> ETH
                    </div>
                    {
                        !canConnectToContract && <i className="is-block">
                        Connect to Ganache to interact with the contract
                        </i>
                    }
                    <button
                        disabled={!canConnectToContract}
                        onClick={addFunds}
                        className="button is-link mr-2"
                    >
                        Donate 1 ETH
                    </button>
                    <button
                        disabled={!canConnectToContract}
                        onClick={withdrawFunds}
                        className="button is-primary"
                    >
                        Withdraw 0.1 ETH
                    </button>
                </div>
            </div>
        </>
    );
}

export default App;
