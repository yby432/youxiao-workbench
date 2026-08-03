import { useState } from 'react';
import { Coins, User, Phone, MapPin } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Label } from '@client/src/components/ui/label';

interface ExchangeFormProps {
  prizeName: string;
  beanCost: number;
  onSubmit: (form: { receiverName: string; receiverPhone: string; address: string }) => Promise<void>;
  onCancel: () => void;
}

const ExchangeForm = ({ prizeName, beanCost, onSubmit, onCancel }: ExchangeFormProps) => {
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!receiverName.trim()) {
      newErrors.receiverName = '请输入收货人姓名';
    }
    if (!receiverPhone.trim()) {
      newErrors.receiverPhone = '请输入联系电话';
    } else if (!/^1[3-9]\d{9}$/.test(receiverPhone.trim())) {
      newErrors.receiverPhone = '请输入正确的手机号';
    }
    if (!address.trim()) {
      newErrors.address = '请输入收货地址';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        address: address.trim(),
      });
    } catch (error) {
      logger.error('提交兑换失败', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {/* 兑换确认 */}
      <div className="bg-gradient-to-r from-[hsl(340_70%_94%)] to-[hsl(45_80%_94%)] rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-[hsl(220_10%_50%)]">兑换</div>
          <div className="text-base font-semibold text-[hsl(220_15%_25%)]">{prizeName}</div>
        </div>
        <div className="flex items-center gap-1">
          <Coins className="w-5 h-5 text-[hsl(45_90%_55%)]" />
          <span
            className="text-xl font-bold text-[hsl(28_90%_50%)]"
            style={{ fontFamily: '"Nunito", monospace' }}
          >
            -{beanCost}
          </span>
        </div>
      </div>

      {/* 收货人 */}
      <div className="space-y-1.5">
        <Label htmlFor="receiverName" className="text-sm text-[hsl(220_15%_25%)]">
          <User className="w-4 h-4 inline mr-1 -mt-0.5" />
          收货人
        </Label>
        <Input
          id="receiverName"
          value={receiverName}
          onChange={(e) => setReceiverName(e.target.value)}
          placeholder="请输入收货人姓名"
          className={`rounded-xl h-11 ${errors.receiverName ? 'border-[hsl(0_60%_70%)]' : ''}`}
        />
        {errors.receiverName && (
          <p className="text-xs text-[hsl(0_60%_60%)]">{errors.receiverName}</p>
        )}
      </div>

      {/* 联系电话 */}
      <div className="space-y-1.5">
        <Label htmlFor="receiverPhone" className="text-sm text-[hsl(220_15%_25%)]">
          <Phone className="w-4 h-4 inline mr-1 -mt-0.5" />
          联系电话
        </Label>
        <Input
          id="receiverPhone"
          value={receiverPhone}
          onChange={(e) => setReceiverPhone(e.target.value)}
          placeholder="请输入手机号"
          type="tel"
          className={`rounded-xl h-11 ${errors.receiverPhone ? 'border-[hsl(0_60%_70%)]' : ''}`}
        />
        {errors.receiverPhone && (
          <p className="text-xs text-[hsl(0_60%_60%)]">{errors.receiverPhone}</p>
        )}
      </div>

      {/* 收货地址 */}
      <div className="space-y-1.5">
        <Label htmlFor="address" className="text-sm text-[hsl(220_15%_25%)]">
          <MapPin className="w-4 h-4 inline mr-1 -mt-0.5" />
          收货地址
        </Label>
        <Textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="请输入详细收货地址"
          rows={3}
          className={`rounded-xl resize-none ${errors.address ? 'border-[hsl(0_60%_70%)]' : ''}`}
        />
        {errors.address && (
          <p className="text-xs text-[hsl(0_60%_60%)]">{errors.address}</p>
        )}
      </div>

      {/* 按钮 */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 h-12 rounded-full bg-[hsl(40_20%_92%)] text-[hsl(220_15%_25%)] hover:bg-[hsl(40_20%_88%)]"
        >
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 h-12 rounded-full bg-gradient-to-r from-[hsl(340_70%_75%)] to-[hsl(28_90%_62%)] text-white font-bold shadow-md hover:shadow-lg active:scale-95 transition-all"
        >
          {submitting ? '兑换中...' : '确认兑换'}
        </Button>
      </div>
    </div>
  );
};

export default ExchangeForm;
