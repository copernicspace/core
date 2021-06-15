export function getSellId(tx) {
    return tx.receipt.logs[0].args.sellID;
}