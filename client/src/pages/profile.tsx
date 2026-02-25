import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Building, UserCircle, Users } from "lucide-react";
import { useState, useEffect } from "react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: profile } = useQuery({ queryKey: ["/api/users/me"] });
  const [formData, setFormData] = useState({
    firstName: "",
    profileImageUrl: "",
    department: "",
    superiorId: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        profileImageUrl: profile.profileImageUrl || "",
        department: profile.department || "",
        superiorId: profile.superiorId || ""
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/users/me", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      toast({ title: "修改成功" });
    }
  });

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
        <UserCircle className="h-6 w-6 text-blue-500" />
        个人中心
      </h1>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Avatar className="h-12 w-12">
              <AvatarImage src={formData.profileImageUrl} />
              <AvatarFallback>{formData.firstName?.[0] || "U"}</AvatarFallback>
            </Avatar>
            个人基本信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <label className="text-xs text-slate-500">头像链接</label>
            <Input 
              value={formData.profileImageUrl}
              onChange={e => setFormData({...formData, profileImageUrl: e.target.value})}
              placeholder="https://..."
              className="glass-input"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs text-slate-500">显示名称</label>
            <Input 
              value={formData.firstName}
              onChange={e => setFormData({...formData, firstName: e.target.value})}
              className="glass-input"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs text-slate-500">部门</label>
            <div className="flex gap-2">
              <Building className="h-4 w-4 mt-2 text-slate-400" />
              <Input 
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
                placeholder="例如：销售部"
                className="glass-input"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-xs text-slate-500">上级主管</label>
            <Select 
              value={formData.superiorId} 
              onValueChange={v => setFormData({...formData, superiorId: v})}
            >
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="选择上级" />
              </SelectTrigger>
              <SelectContent className="glass-dialog">
                <SelectItem value="none">无</SelectItem>
                {profile?.departmentUsers?.map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>{u.firstName || u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="pt-4">
            <h3 className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-2">
              <Users className="h-3 w-3" />
              关联下级 (同部门)
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile?.departmentUsers?.filter((u: any) => u.superiorId === profile.id).map((u: any) => (
                <div key={u.id} className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
                  {u.firstName || u.email}
                </div>
              ))}
              {profile?.departmentUsers?.filter((u: any) => u.superiorId === profile.id).length === 0 && (
                <span className="text-xs text-slate-500 italic">暂无关联下级</span>
              )}
            </div>
          </div>

          <Button 
            onClick={() => mutation.mutate(formData)}
            className="w-full glow-btn text-white border-0"
            disabled={mutation.isPending}
          >
            保存修改
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
