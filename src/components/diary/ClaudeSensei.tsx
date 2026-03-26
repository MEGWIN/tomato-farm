type Props = {
  analysis: string | null;
  advice: string | null;
};

export default function ClaudeSensei({ analysis, advice }: Props) {
  if (!analysis && !advice) return null;

  return (
    <div className="mt-12 bg-gradient-to-br from-leaf-50 to-leaf-100/50 rounded-2xl border border-leaf-200 overflow-hidden">
      {/* Header */}
      <div className="bg-leaf-600 text-white px-6 py-4 flex items-center gap-3">
        <span className="text-3xl">🩺</span>
        <div>
          <h2 className="font-heading font-black text-xl">
            Claude先生のトマト診察室
          </h2>
          <p className="text-leaf-100 text-sm">AI栽培アドバイザーの分析レポート</p>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Analysis */}
        {analysis && (
          <div>
            <h3 className="font-heading font-bold text-leaf-700 text-lg mb-3 flex items-center gap-2">
              📊 分析レポート
            </h3>
            <div
              className="prose prose-sm max-w-none text-soil-800"
              dangerouslySetInnerHTML={{ __html: analysis }}
            />
          </div>
        )}

        {/* Advice */}
        {advice && (
          <div className="bg-sunshine-100/50 rounded-xl p-5 border border-sunshine-300/50">
            <h3 className="font-heading font-bold text-sunshine-500 text-lg mb-2 flex items-center gap-2">
              💡 次回への指示
            </h3>
            <p className="text-soil-800 leading-relaxed">{advice}</p>
          </div>
        )}
      </div>
    </div>
  );
}
