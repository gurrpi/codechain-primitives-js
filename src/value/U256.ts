import { BigNumber } from "bignumber.js";

/**
 * @hidden
 */
const RLP = require("rlp");

/**
 * Handles 256-bit unsigned integers. Used to express nonce, asset amount, etc.
 */
export class U256 {
    public static MAX_VALUE = new BigNumber(
        "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
    );

    public static fromBytes(buffer: Buffer): U256 {
        const bytes = Array.from(buffer.values());
        const length = bytes.shift()! - 0x80;
        if (length > 32) {
            throw Error("Buffer for U256 must be less than or equal to 32");
        } else if (bytes.length !== length) {
            throw Error(`Invalid RLP for U256: ${bytes}`);
        } else if (length === 0) {
            return new U256(0);
        }
        return new U256(
            "0x" +
                bytes
                    .map(
                        byte =>
                            byte < 0x10
                                ? `0${byte.toString(16)}`
                                : byte.toString(16)
                    )
                    .join("")
        );
    }

    public static check(param: U256 | string | number | BigNumber) {
        if (param instanceof U256) {
            return true;
        } else if (param instanceof BigNumber) {
            return (
                param.isInteger() &&
                !param.isNegative() &&
                param.isLessThanOrEqualTo(U256.MAX_VALUE)
            );
        } else if (typeof param === "number") {
            return Number.isInteger(param) && param >= 0;
        } else {
            return U256.checkString(param);
        }
    }

    public static ensure(param: U256 | string | number | BigNumber) {
        return param instanceof U256 ? param : new U256(param);
    }

    private static checkString(param: string): boolean {
        if (typeof param !== "string") {
            return false;
        }
        const num = new BigNumber(param);
        return (
            num.isInteger() &&
            !num.isNegative() &&
            num.isLessThanOrEqualTo(U256.MAX_VALUE)
        );
    }

    public value: BigNumber;

    constructor(value: number | string | BigNumber) {
        this.value = new BigNumber(value);
        if (!this.value.isInteger() || this.value.isNegative()) {
            throw Error(`U256 must be a positive integer but found ${value}`);
        } else if (this.value.toString(16).length > 64) {
            throw Error("Given value is out of range for U256");
        }
    }

    public increase(): U256 {
        return new U256(this.value.plus(1));
    }

    public toEncodeObject(): string | number {
        const hex = this.value.toString(16);
        // NOTE: workaround that RLP.encode("0x0") results to 00
        if (hex === "0") {
            return 0;
        } else {
            return hex.length % 2 === 0 ? `0x${hex}` : `0x0${hex}`;
        }
    }

    public rlpBytes(): Buffer {
        return RLP.encode(this.toEncodeObject());
    }

    public isEqualTo(rhs: U256): boolean {
        return this.value.isEqualTo(rhs.value);
    }

    public toString(base?: 10 | 16) {
        return this.value.toString(base || 10);
    }
}
