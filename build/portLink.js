"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortLink = void 0;
/**
 * Class that defines the link to a port (input or output)
 */
class PortLink {
    constructor() {
        this._cardNumber = 0;
        this._portNumber = 0;
        this._test = "text";
    }
    /**
     * Returns the number of the card the port is assigned to. [1..8]
     */
    get cardNumber() {
        return this._cardNumber;
    }
    /**
     * Sets the card number [1..8]
     */
    set cardNumber(cardNumber) {
        if (cardNumber < 1) {
            this._cardNumber = 1;
        }
        else if (cardNumber > 8) {
            this._cardNumber = 8;
        }
        else {
            this._cardNumber = cardNumber;
        }
    }
    /**
     * Returns the number of the port on the card. [1..4] for output ports or [1..8] for input ports
     */
    get portNumber() {
        return this._portNumber;
    }
    /**
     * Sets the port number [1..8]
     */
    set portNumber(portNumber) {
        if (portNumber < 1) {
            this._portNumber = 1;
        }
        else if (portNumber > 8) {
            this._portNumber = 8;
        }
        else {
            this._portNumber = portNumber;
        }
    }
}
exports.PortLink = PortLink;
