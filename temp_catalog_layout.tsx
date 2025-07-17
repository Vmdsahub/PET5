// Layout melhorado para o catálogo - similar ao inventário
{
  /* Catalog Items */
}
<div className="grid grid-cols-2 gap-4 overflow-y-auto h-full">
  {catalogItems.map((item) => (
    <motion.div
      key={item.id}
      className="aspect-square border border-gray-300 rounded-lg flex flex-col items-center justify-center p-3 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors relative overflow-hidden"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 mb-2">
        {item.id === "premium-sofa" ? (
          <img
            src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IiNmMGYwZjAiLz48cmVjdCB4PSIyMCIgeT0iNjAiIHdpZHRoPSI4OCIgaGVpZ2h0PSIzNSIgcng9IjUiIGZpbGw9IiM0QTVEMjMiLz48cmVjdCB4PSIyMCIgeT0iNDUiIHdpZHRoPSI4OCIgaGVpZ2h0PSIzMCIgcng9IjMiIGZpbGw9IiM0QTVEMjMiLz48cmVjdCB4PSIxNSIgeT0iNDAiIHdpZHRoPSIxMCIgaGVpZ2h0PSI0MCIgcng9IjUiIGZpbGw9IiM4QjQ1MTMiLz48cmVjdCB4PSIxMDMiIHk9IjQwIiB3aWR0aD0iMTAiIGhlaWdodD0iNDAiIHJ4PSI1IiBmaWxsPSIjOEI0NTEzIi8+PHJlY3QgeD0iMjUiIHk9IjUwIiB3aWR0aD0iMjAiIGhlaWdodD0iMTUiIHJ4PSIzIiBmaWxsPSIjQ0Q4NTNGIi8+PHJlY3QgeD0iODMiIHk9IjUwIiB3aWR0aD0iMjAiIGhlaWdodD0iMTUiIHJ4PSIzIiBmaWxsPSIjQ0Q4NTNGIi8+PC9zdmc+"
            alt={item.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IiNmMGYwZjAiLz48cmVjdCB4PSI2MCIgeT0iMjAiIHdpZHRoPSI4IiBoZWlnaHQ9IjgwIiBmaWxsPSIjOEI0NTEzIi8+PHBvbHlnb24gcG9pbnRzPSI2NCwxNSA1Miw0MCA3Niw0MCIgZmlsbD0iI0UwRTBFMCIgc3Ryb2tlPSIjQjBCMEIwIiBzdHJva2Utd2lkdGg9IjEiLz48Y2lyY2xlIGN4PSI2NCIgY3k9IjMwIiByPSIzIiBmaWxsPSIjRkZENzAwIiBvcGFjaXR5PSIwLjgiLz48cmVjdCB4PSI1MCIgeT0iMTAwIiB3aWR0aD0iMjgiIGhlaWdodD0iOCIgcng9IjQiIGZpbGw9IiM4QjQ1MTMiLz48L3N2Zz4="
            alt={item.name}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* Name */}
      <span className="text-xs text-center font-medium text-gray-700 leading-tight mb-2">
        {item.name}
      </span>

      {/* Price */}
      <div className="flex items-center gap-1 mb-2">
        {item.currency === "xenocoins" ? (
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Ff481900009a94cda953c032479392a30%2F3e6c6cb85c6a4d2ba05acb245bfbc214?format=webp&width=800"
            alt="Xenocoins"
            className="w-3 h-3"
          />
        ) : (
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fc013caa4db474e638dc2961a6085b60a%2F38a7eab3791441c7bc853afba8904317?format=webp&width=800"
            alt="Xenocash"
            className="w-3 h-3"
          />
        )}
        <span className="font-bold text-gray-700 text-xs">
          {item.price.toLocaleString()}
        </span>
      </div>

      {/* Buy Button */}
      <motion.button
        onClick={() => handlePurchase(item)}
        className={`px-3 py-1 rounded-lg font-medium text-xs transition-all ${
          (item.currency === "xenocoins" ? xenocoins : cash) >= item.price
            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
        whileHover={
          (item.currency === "xenocoins" ? xenocoins : cash) >= item.price
            ? { scale: 1.05 }
            : {}
        }
        whileTap={
          (item.currency === "xenocoins" ? xenocoins : cash) >= item.price
            ? { scale: 0.95 }
            : {}
        }
        disabled={
          (item.currency === "xenocoins" ? xenocoins : cash) < item.price
        }
      >
        🛒 Comprar
      </motion.button>
    </motion.div>
  ))}
</div>;
