import { RampInstantSDK } from '@ramp-network/ramp-instant-sdk';

import { networkId } from "./web3"

export interface ZapList { 
    hostAppName: string,
}

export interface RampOptions {
  walletAddress: string
  hasZkSync: boolean
}

const { REACT_APP_RAMP_API_KEY } = process.env

const RAMP_ASSETS_MAINNET = "ETH,USDC,USDT,DAI"
const RAMP_ASSETS_ZKSYNC = "ZKSYNC_ETH,ZKSYNC_WBTC,ZKSYNC_USDC,ZKSYNC_DAI"

export const showRampPromise = ({
  walletAddress,
  hasZkSync,
}: RampOptions): Promise<boolean> =>
  new Promise<boolean>((res, rej) => {
    new RampInstantSDK({
      hostAppName: "Nix NFT Market",
      hostLogoUrl: `${window.location.protocol}//${window.location.host}/images/icons/public-app-icon.png`,
      swapAsset:
        networkId === 1
          ? "WETH9"
          : "ETH",
      userAddress: walletAddress,
      ...(REACT_APP_RAMP_API_KEY && {
        hostApiKey: REACT_APP_RAMP_API_KEY,
      }),
      ...(networkId === 3 && {
        url: "https://ri-widget-staging-ropsten.firebaseapp.com/",
      }),
    })
      /** Possible Events (for more info see https://docs.ramp.network/events)
        WIDGET_CLOSE = "WIDGET_CLOSE",
        WIDGET_CONFIG_DONE = "WIDGET_CONFIG_DONE",
        WIDGET_CONFIG_FAILED = "WIDGET_CONFIG_FAILED",
        PURCHASE_CREATED = "PURCHASE_CREATED",
        PURCHASE_SUCCESSFUL = "PURCHASE_SUCCESSFUL",
        PURCHASE_FAILED = "PURCHASE_FAILED"
      */
      .on("*", (event) => {
        console.log(event)
        switch (event.type) {
          case "WIDGET_CONFIG_DONE":
            return document
              .querySelector("body > div:last-of-type")
              ?.shadowRoot?.querySelector("div.overlay")
              ?.classList.remove("ramp--loading-overwrite")
          case "WIDGET_CLOSE":
            return res(false)
          case "PURCHASE_FAILED":
          case "WIDGET_CONFIG_FAILED":
            return rej(event.type)
          case "PURCHASE_SUCCESSFUL":
            return res(true)
        }
      })
      .show()

    const styleEl = document.createElement("style")
    styleEl.appendChild(
      document.createTextNode(`
        .ramp--loading-overwrite {
          opacity: 0;
        }
      `),
    )
    document
      .querySelector("body > div:last-of-type")
      ?.shadowRoot?.querySelector("div.overlay")
      ?.classList.add("ramp--loading-overwrite")
    document
      .querySelector("body > div:last-of-type")
      ?.shadowRoot?.querySelector("div.overlay")
      ?.appendChild(styleEl)
  })
